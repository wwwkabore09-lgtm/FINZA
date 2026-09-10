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

export async function getOrCreateHousehold(userId: string): Promise<string> {
  const { data: membership, error: membershipError } = await supabase
    .from('household_members')
    .select('household_id')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle()

  if (membershipError) throw membershipError
  if (membership) return membership.household_id

  const { data: household, error: householdError } = await supabase
    .from('households')
    .insert({ name: 'Mon foyer', created_by: userId })
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
