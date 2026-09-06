import { createClient } from '@supabase/supabase-js'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { isAdminEmail } from '../../src/lib/admin'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Méthode non autorisée' })
    return
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceRoleKey) {
    res.status(500).json({ error: 'Configuration serveur manquante' })
    return
  }

  const authHeader = req.headers.authorization
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) {
    res.status(401).json({ error: 'Authentification requise' })
    return
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { data: callerData, error: callerError } = await admin.auth.getUser(token)
  if (callerError || !callerData.user || !isAdminEmail(callerData.user.email)) {
    res.status(403).json({ error: 'Accès refusé' })
    return
  }

  try {
    const [
      authUsersResult,
      householdsRes,
      membersRes,
      accountsRes,
      transactionsRes,
      budgetsRes,
      goalsRes,
      debtsRes,
    ] = await Promise.all([
      admin.auth.admin.listUsers({ perPage: 1000 }),
      admin.from('households').select('id, name, created_at'),
      admin.from('household_members').select('household_id, user_id'),
      admin.from('accounts').select('*', { count: 'exact', head: true }),
      admin.from('transactions').select('*', { count: 'exact', head: true }),
      admin.from('budgets').select('*', { count: 'exact', head: true }),
      admin.from('goals').select('*', { count: 'exact', head: true }),
      admin.from('debts').select('*', { count: 'exact', head: true }),
    ])

    const households = householdsRes.data ?? []
    const members = membersRes.data ?? []

    const memberCountByHousehold = new Map<string, number>()
    const householdIdByUser = new Map<string, string>()
    for (const member of members) {
      memberCountByHousehold.set(
        member.household_id,
        (memberCountByHousehold.get(member.household_id) ?? 0) + 1,
      )
      householdIdByUser.set(member.user_id, member.household_id)
    }

    const users = (authUsersResult.data?.users ?? []).map((authUser) => ({
      id: authUser.id,
      email: authUser.email ?? null,
      firstName: (authUser.user_metadata?.first_name as string | undefined) ?? null,
      lastName: (authUser.user_metadata?.last_name as string | undefined) ?? null,
      country: (authUser.user_metadata?.country as string | undefined) ?? null,
      createdAt: authUser.created_at,
      lastSignInAt: authUser.last_sign_in_at ?? null,
      householdId: householdIdByUser.get(authUser.id) ?? null,
    }))

    const usersByCountryMap = new Map<string, number>()
    for (const u of users) {
      const key = u.country ?? 'Non renseigné'
      usersByCountryMap.set(key, (usersByCountryMap.get(key) ?? 0) + 1)
    }
    const usersByCountry = Array.from(usersByCountryMap.entries())
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count)

    const householdList = households.map((household) => ({
      id: household.id,
      name: household.name,
      createdAt: household.created_at,
      memberCount: memberCountByHousehold.get(household.id) ?? 0,
    }))

    res.status(200).json({
      totals: {
        users: users.length,
        households: households.length,
        accounts: accountsRes.count ?? 0,
        transactions: transactionsRes.count ?? 0,
        budgets: budgetsRes.count ?? 0,
        goals: goalsRes.count ?? 0,
        debts: debtsRes.count ?? 0,
      },
      usersByCountry,
      users,
      households: householdList,
    })
  } catch {
    res.status(500).json({ error: 'Erreur lors du chargement des données' })
  }
}
