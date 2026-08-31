-- Fix: a user creating a household could not read it back immediately after
-- insert, because the SELECT policy required household_members to already
-- contain them — which only happens in the *next* insert. Allow the creator
-- to see their own household even before that membership row exists.

drop policy "households: members can select" on households;

create policy "households: members can select" on households
  for select using (is_household_member(id) or created_by = auth.uid());
