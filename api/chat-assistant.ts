import type { VercelRequest, VercelResponse } from '@vercel/node'

const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Méthode non autorisée' })
    return
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    res.status(500).json({ error: "Clé API Gemini manquante" })
    return
  }

  const { messages, context } = req.body as {
    messages?: ChatMessage[]
    context?: Record<string, unknown>
  }

  if (!messages || messages.length === 0) {
    res.status(400).json({ error: 'Requête invalide' })
    return
  }

  const systemInstruction = `Tu es l'assistant financier de Finza, une application de gestion financière personnelle et familiale pour l'Afrique francophone. Tu réponds aux questions de l'utilisateur sur ses finances en te basant UNIQUEMENT sur les données ci-dessous (en Franc CFA / XOF). Donne des conseils concrets et pratiques quand c'est pertinent. Réponds en français, de façon claire, chaleureuse et concise (quelques phrases, pas un essai). Si une information demandée n'est pas dans les données fournies, dis-le clairement plutôt que d'inventer un chiffre. Ne montre jamais de calcul intermédiaire ni de brouillon : donne directement ta réponse finale.

Données financières actuelles de l'utilisateur :
${JSON.stringify(context ?? {})}`

  try {
    const response = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemInstruction }] },
        contents: messages.map((message) => ({
          role: message.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: message.content }],
        })),
        generationConfig: { temperature: 0.4, maxOutputTokens: 2000 },
      }),
    })

    if (!response.ok) {
      res.status(502).json({ error: 'Erreur du service IA' })
      return
    }

    const data = (await response.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[]
    }
    const parts = data.candidates?.[0]?.content?.parts ?? []
    const reply = parts
      .map((p) => p.text ?? '')
      .join('')
      .trim()

    if (!reply) {
      res.status(502).json({ error: "L'assistant n'a pas pu répondre. Réessaie." })
      return
    }

    res.status(200).json({ reply })
  } catch {
    res.status(502).json({ error: 'Impossible de contacter le service IA' })
  }
}
