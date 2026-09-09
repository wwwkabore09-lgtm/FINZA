import { Bot, Send, Sparkles, User as UserIcon } from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useHousehold } from '../hooks/useHousehold'
import { supabase } from '../lib/supabase'
import { LoadingState } from './Spinner'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface CategoryAmountRow {
  amount: number
  categories: { name: string } | null
}

function sumByCategory(rows: CategoryAmountRow[], expensesOnly: boolean): Record<string, number> {
  const totals: Record<string, number> = {}
  for (const row of rows) {
    if (expensesOnly && row.amount >= 0) continue
    if (!expensesOnly && row.amount < 0) continue
    const name = row.categories?.name ?? 'Autre'
    totals[name] = (totals[name] ?? 0) + Math.abs(row.amount)
  }
  return totals
}

const STARTER_PROMPTS = [
  'Quelles ont été mes dépenses le mois dernier ?',
  'Comment puis-je réduire mes dépenses ce mois-ci ?',
  "Suis-je sur la bonne voie pour mes objectifs d'épargne ?",
]

interface ChatAssistantProps {
  heightClass?: string
  showHeader?: boolean
}

export function ChatAssistant({
  heightClass = 'h-[calc(100vh-140px)] sm:h-[calc(100vh-180px)]',
  showHeader = true,
}: ChatAssistantProps) {
  const { user } = useAuth()
  const { householdId, loading: householdLoading } = useHousehold()
  const [context, setContext] = useState<Record<string, unknown> | null>(null)
  const [contextLoading, setContextLoading] = useState(true)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!householdId) return
    let cancelled = false

    async function loadContext() {
      setContextLoading(true)

      const monthStart = new Date()
      monthStart.setDate(1)
      const monthStartStr = monthStart.toISOString().slice(0, 10)
      const prevMonthStart = new Date(monthStart)
      prevMonthStart.setMonth(prevMonthStart.getMonth() - 1)
      const prevMonthStartStr = prevMonthStart.toISOString().slice(0, 10)

      const [accountsRes, budgetsRes, categoriesRes, goalsRes, debtsRes] = await Promise.all([
        supabase.from('accounts').select('*').eq('household_id', householdId as string),
        supabase.from('budgets').select('*').eq('household_id', householdId as string),
        supabase.from('categories').select('*').eq('household_id', householdId as string),
        supabase.from('goals').select('*').eq('household_id', householdId as string),
        supabase.from('debts').select('*').eq('household_id', householdId as string).eq('settled', false),
      ])

      const accounts = (accountsRes.data ?? []) as { name: string; type: string; balance: number }[]
      const accountIds = (accountsRes.data ?? []).map((a) => a.id as string)
      const categories = (categoriesRes.data ?? []) as { id: string; name: string }[]

      let currentMonthRows: CategoryAmountRow[] = []
      let prevMonthRows: CategoryAmountRow[] = []
      if (accountIds.length > 0) {
        const [currentRes, prevRes] = await Promise.all([
          supabase
            .from('transactions')
            .select('amount, categories(name)')
            .in('account_id', accountIds)
            .gte('date', monthStartStr),
          supabase
            .from('transactions')
            .select('amount, categories(name)')
            .in('account_id', accountIds)
            .gte('date', prevMonthStartStr)
            .lt('date', monthStartStr),
        ])
        currentMonthRows = (currentRes.data ?? []) as unknown as CategoryAmountRow[]
        prevMonthRows = (prevRes.data ?? []) as unknown as CategoryAmountRow[]
      }

      const budgets = ((budgetsRes.data ?? []) as { category_id: string; amount: number }[]).map(
        (budget) => ({
          categorie: categories.find((c) => c.id === budget.category_id)?.name ?? 'Autre',
          budgetXof: budget.amount,
        }),
      )

      const goals = ((goalsRes.data ?? []) as { name: string; current_amount: number; target_amount: number }[]).map(
        (goal) => ({ nom: goal.name, actuelXof: goal.current_amount, cibleXof: goal.target_amount }),
      )

      const debts = (debtsRes.data ?? []) as { direction: string; amount: number }[]
      const jeDois = debts.filter((d) => d.direction === 'owed_by_me').reduce((s, d) => s + d.amount, 0)
      const onMeDoit = debts.filter((d) => d.direction === 'owed_to_me').reduce((s, d) => s + d.amount, 0)

      if (!cancelled) {
        setContext({
          soldeTotalXof: accounts.reduce((s, a) => s + a.balance, 0),
          comptes: accounts.map((a) => ({ nom: a.name, type: a.type, soldeXof: a.balance })),
          depensesMoisActuelParCategorieXof: sumByCategory(currentMonthRows, true),
          depensesMoisDernierParCategorieXof: sumByCategory(prevMonthRows, true),
          revenusMoisActuelXof: Object.values(sumByCategory(currentMonthRows, false)).reduce(
            (s, v) => s + v,
            0,
          ),
          budgets,
          objectifsEpargne: goals,
          dettesJeDoisXof: jeDois,
          dettesOnMeDoitXof: onMeDoit,
        })
        setContextLoading(false)
      }
    }

    loadContext()
    return () => {
      cancelled = true
    }
  }, [householdId])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, sending])

  async function sendMessage(text: string) {
    const trimmed = text.trim()
    if (!trimmed || sending) return

    const nextMessages: ChatMessage[] = [...messages, { role: 'user', content: trimmed }]
    setMessages(nextMessages)
    setInput('')
    setSending(true)
    setError(null)

    try {
      const response = await fetch('/api/chat-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: nextMessages, context }),
      })
      const data = (await response.json()) as { reply?: string; error?: string }
      if (!response.ok || !data.reply) {
        throw new Error(data.error ?? 'Erreur inconnue')
      }
      setMessages((current) => [...current, { role: 'assistant', content: data.reply as string }])
    } catch {
      setError("L'assistant n'a pas pu répondre. Réessaie dans un instant.")
    } finally {
      setSending(false)
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    sendMessage(input)
  }

  if (householdLoading || contextLoading) {
    return <LoadingState />
  }

  const firstName = user?.user_metadata?.first_name as string | undefined

  return (
    <div className={`flex ${heightClass} flex-col`}>
      {showHeader && (
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Assistant Finza</h1>
          <p className="mt-1 text-sm text-slate-500">
            Pose une question sur tes finances, l'assistant se base sur tes vraies données.
          </p>
        </div>
      )}

      <div
        ref={scrollRef}
        className={`${showHeader ? 'mt-4' : ''} flex-1 space-y-4 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-4`}
      >
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <Sparkles size={22} strokeWidth={2} />
            </span>
            <p className="text-sm text-slate-500">
              Bonjour{firstName ? `, ${firstName}` : ''} ! Pose-moi une question sur tes finances.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {STARTER_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => sendMessage(prompt)}
                  className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={index}
              className={`flex items-start gap-2.5 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                  message.role === 'user'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-emerald-50 text-emerald-700'
                }`}
              >
                {message.role === 'user' ? (
                  <UserIcon size={15} strokeWidth={2} />
                ) : (
                  <Bot size={15} strokeWidth={2} />
                )}
              </span>
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                  message.role === 'user'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-50 text-slate-800'
                }`}
              >
                {message.content}
              </div>
            </div>
          ))
        )}
        {sending && (
          <div className="flex items-start gap-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
              <Bot size={15} strokeWidth={2} />
            </span>
            <div className="rounded-2xl bg-slate-50 px-4 py-2.5 text-sm text-slate-400">
              L'assistant réfléchit...
            </div>
          </div>
        )}
      </div>

      {error && <p className="mt-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <form onSubmit={handleSubmit} className="mt-3 flex items-center gap-2">
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Écris ta question..."
          className="flex-1 rounded-full border border-slate-300 px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
        <button
          type="submit"
          disabled={sending || !input.trim()}
          aria-label="Envoyer"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          <Send size={16} strokeWidth={2} />
        </button>
      </form>
    </div>
  )
}
