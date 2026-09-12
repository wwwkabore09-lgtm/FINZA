-- Recurring transactions: rules that auto-generate real transactions on a
-- schedule (weekly/monthly), processed by a daily cron (api/cron/process-recurring).

create table recurring_transactions (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households (id) on delete cascade,
  account_id uuid not null references accounts (id) on delete cascade,
  category_id uuid references categories (id) on delete set null,
  amount numeric(14, 2) not null,
  description text not null default '',
  frequency text not null check (frequency in ('weekly', 'monthly')),
  next_run_date date not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index recurring_transactions_household_id_idx on recurring_transactions (household_id);
create index recurring_transactions_due_idx on recurring_transactions (next_run_date) where active;

alter table recurring_transactions enable row level security;

create policy "recurring_transactions: members can select" on recurring_transactions
  for select using (is_household_member(household_id));
create policy "recurring_transactions: members can insert" on recurring_transactions
  for insert with check (is_household_member(household_id));
create policy "recurring_transactions: members can update" on recurring_transactions
  for update using (is_household_member(household_id));
create policy "recurring_transactions: members can delete" on recurring_transactions
  for delete using (is_household_member(household_id));
