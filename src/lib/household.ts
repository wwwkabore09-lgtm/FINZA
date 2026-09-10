import { supabase } from './supabase'

const DEFAULT_CATEGORIES = [
  'Alimentation',
  'Transport',
  'Logement',
  'Santé',
  'Loisirs',
  'Salaire',
  'Autre',
]

async function createHouseholdRow(userId: string, name: string): Promise<string> {
  const { data: household, error: householdError } = await supabase
    .from('households')
    .insert({ name, created_by: userId })
    .select('id')
    .single()
  if (householdError) throw householdError

  const { error: memberError } = await supabase
    .from('household_members')
    .insert({ household_id: household.id, user_id: userId, role: 'owner' })
  if (memberError) throw memberError

  const { error: categoriesError } = await supabase.from('categories').insert(
    DEFAULT_CATEGORIES.map((name) => ({ household_id: household.id, name })),
  )
  if (categoriesError) throw categoriesError

  return household.id
}

export async function getOrCreateHousehold(userId: string): Promise<string> {
  const { data: membership, error: membershipError } = await supabase
    .from('household_members')
    .select('household_id')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle()

  if (membershipError) throw membershipError
  if (membership) return membership.household_id

  return createHouseholdRow(userId, 'Mon foyer')
}

export interface HouseholdSummary {
  id: string
  name: string
  inviteCode: string | null
}

export async function listUserHouseholds(userId: string): Promise<HouseholdSummary[]> {
  const { data, error } = await supabase
    .from('household_members')
    .select('household_id, households(id, name, invite_code)')
    .eq('user_id', userId)
  if (error) throw error

  return (data ?? [])
    .map((row) => row.households as unknown as { id: string; name: string; invite_code: string | null } | null)
    .filter((household): household is { id: string; name: string; invite_code: string | null } => household !== null)
    .map((household) => ({ id: household.id, name: household.name, inviteCode: household.invite_code }))
}

export async function createHousehold(userId: string, name: string): Promise<string> {
  return createHouseholdRow(userId, name)
}

export async function joinHouseholdByCode(code: string): Promise<string> {
  const { data, error } = await supabase.rpc('join_household_by_code', {
    code: code.trim(),
  })
  if (error) throw error
  return data as string
}
