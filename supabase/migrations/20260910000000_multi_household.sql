-- Multi-household support ("Plusieurs foyers", forfait Pro Max): an invite
-- code per household lets another authenticated user join without a broad
-- SELECT policy (which would leak every household's name/code to any
-- signed-in user) - join_household_by_code is the only sanctioned way in,
-- running as SECURITY DEFINER so it can look up the target row and insert
-- the membership without needing a public households SELECT policy.

alter table households add column invite_code text unique
  default substr(replace(gen_random_uuid()::text, '-', ''), 1, 8);

create or replace function join_household_by_code(code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  target_household_id uuid;
begin
  select id into target_household_id from households where invite_code = code;

  if target_household_id is null then
    raise exception 'Code d''invitation invalide';
  end if;

  insert into household_members (household_id, user_id, role)
  values (target_household_id, auth.uid(), 'member')
  on conflict (household_id, user_id) do nothing;

  return target_household_id;
end;
$$;

grant execute on function join_household_by_code(text) to authenticated;
