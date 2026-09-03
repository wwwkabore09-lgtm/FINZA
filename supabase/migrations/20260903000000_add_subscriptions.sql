-- Subscriptions: one active/pending plan per household, paid via PayDunya
-- (test mode). Household members can manage their own subscription row
-- directly; there is no separate service-role write path.

create type subscription_status as enum ('pending', 'active', 'cancelled');

create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households (id) on delete cascade,
  plan text not null,
  amount numeric(14, 2) not null,
  status subscription_status not null default 'pending',
  paydunya_token text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index subscriptions_paydunya_token_idx on subscriptions (paydunya_token)
  where paydunya_token is not null;
create index subscriptions_household_id_idx on subscriptions (household_id);

alter table subscriptions enable row level security;

create policy "subscriptions: members can select" on subscriptions
  for select using (is_household_member(household_id));
create policy "subscriptions: members can insert" on subscriptions
  for insert with check (is_household_member(household_id));
create policy "subscriptions: members can update" on subscriptions
  for update using (is_household_member(household_id));
