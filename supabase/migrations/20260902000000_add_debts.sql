-- Debts: informal loans between a household member and another person
-- (not necessarily a Finza user), in either direction.

create type debt_direction as enum ('owed_by_me', 'owed_to_me');

create table debts (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households (id) on delete cascade,
  person_name text not null,
  direction debt_direction not null,
  amount numeric(14, 2) not null,
  description text,
  settled boolean not null default false,
  created_at timestamptz not null default now()
);

create index debts_household_id_idx on debts (household_id);

alter table debts enable row level security;

create policy "debts: members can select" on debts
  for select using (is_household_member(household_id));
create policy "debts: members can insert" on debts
  for insert with check (is_household_member(household_id));
create policy "debts: members can update" on debts
  for update using (is_household_member(household_id));
create policy "debts: members can delete" on debts
  for delete using (is_household_member(household_id));
