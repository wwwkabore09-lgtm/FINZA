-- Finza initial schema: households, accounts, transactions, categories,
-- budgets, goals — with Row Level Security scoped to household membership.

create extension if not exists pgcrypto;

create type account_type as enum ('mobile_money', 'bank', 'cash');

-- ---------------------------------------------------------------------------
-- households
-- ---------------------------------------------------------------------------
create table households (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

-- Join table: which users belong to which household, and their role.
create table household_members (
  household_id uuid not null references households (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'owner' check (role in ('owner', 'member')),
  created_at timestamptz not null default now(),
  primary key (household_id, user_id)
);

-- ---------------------------------------------------------------------------
-- accounts
-- ---------------------------------------------------------------------------
create table accounts (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households (id) on delete cascade,
  name text not null,
  type account_type not null,
  balance numeric(14, 2) not null default 0,
  currency text not null default 'XOF',
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- categories
-- ---------------------------------------------------------------------------
create table categories (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households (id) on delete cascade,
  name text not null,
  icon text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- transactions
-- ---------------------------------------------------------------------------
create table transactions (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references accounts (id) on delete cascade,
  category_id uuid references categories (id) on delete set null,
  amount numeric(14, 2) not null,
  description text not null default '',
  date date not null default current_date,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- budgets
-- ---------------------------------------------------------------------------
create table budgets (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households (id) on delete cascade,
  category_id uuid not null references categories (id) on delete cascade,
  amount numeric(14, 2) not null,
  period text not null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- goals
-- ---------------------------------------------------------------------------
create table goals (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households (id) on delete cascade,
  name text not null,
  target_amount numeric(14, 2) not null,
  current_amount numeric(14, 2) not null default 0,
  deadline date,
  created_at timestamptz not null default now()
);

create index accounts_household_id_idx on accounts (household_id);
create index categories_household_id_idx on categories (household_id);
create index budgets_household_id_idx on budgets (household_id);
create index goals_household_id_idx on goals (household_id);
create index transactions_account_id_idx on transactions (account_id);
create index transactions_category_id_idx on transactions (category_id);
create index household_members_user_id_idx on household_members (user_id);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

-- Security-definer helper: bypasses RLS internally so household_members
-- policies don't recurse into themselves.
create function is_household_member(target_household_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from household_members hm
    where hm.household_id = target_household_id
      and hm.user_id = auth.uid()
  );
$$;

alter table households enable row level security;
alter table household_members enable row level security;
alter table accounts enable row level security;
alter table categories enable row level security;
alter table transactions enable row level security;
alter table budgets enable row level security;
alter table goals enable row level security;

-- households: any signed-in user can create one; only members can see/edit it.
create policy "households: members can select" on households
  for select using (is_household_member(id));

create policy "households: creator can insert" on households
  for insert with check (created_by = auth.uid());

create policy "households: members can update" on households
  for update using (is_household_member(id));

create policy "households: members can delete" on households
  for delete using (is_household_member(id));

-- household_members: members of a household can see the roster.
-- A user may only add themself (inviting others is not implemented yet).
create policy "household_members: members can select" on household_members
  for select using (is_household_member(household_id));

create policy "household_members: self can insert" on household_members
  for insert with check (user_id = auth.uid());

create policy "household_members: self can delete" on household_members
  for delete using (user_id = auth.uid());

-- accounts / categories / budgets / goals: scoped to household membership.
create policy "accounts: members can select" on accounts
  for select using (is_household_member(household_id));
create policy "accounts: members can insert" on accounts
  for insert with check (is_household_member(household_id));
create policy "accounts: members can update" on accounts
  for update using (is_household_member(household_id));
create policy "accounts: members can delete" on accounts
  for delete using (is_household_member(household_id));

create policy "categories: members can select" on categories
  for select using (is_household_member(household_id));
create policy "categories: members can insert" on categories
  for insert with check (is_household_member(household_id));
create policy "categories: members can update" on categories
  for update using (is_household_member(household_id));
create policy "categories: members can delete" on categories
  for delete using (is_household_member(household_id));

create policy "budgets: members can select" on budgets
  for select using (is_household_member(household_id));
create policy "budgets: members can insert" on budgets
  for insert with check (is_household_member(household_id));
create policy "budgets: members can update" on budgets
  for update using (is_household_member(household_id));
create policy "budgets: members can delete" on budgets
  for delete using (is_household_member(household_id));

create policy "goals: members can select" on goals
  for select using (is_household_member(household_id));
create policy "goals: members can insert" on goals
  for insert with check (is_household_member(household_id));
create policy "goals: members can update" on goals
  for update using (is_household_member(household_id));
create policy "goals: members can delete" on goals
  for delete using (is_household_member(household_id));

-- transactions: scoped via their parent account's household.
create policy "transactions: members can select" on transactions
  for select using (
    exists (
      select 1 from accounts a
      where a.id = transactions.account_id
        and is_household_member(a.household_id)
    )
  );
create policy "transactions: members can insert" on transactions
  for insert with check (
    exists (
      select 1 from accounts a
      where a.id = transactions.account_id
        and is_household_member(a.household_id)
    )
  );
create policy "transactions: members can update" on transactions
  for update using (
    exists (
      select 1 from accounts a
      where a.id = transactions.account_id
        and is_household_member(a.household_id)
    )
  );
create policy "transactions: members can delete" on transactions
  for delete using (
    exists (
      select 1 from accounts a
      where a.id = transactions.account_id
        and is_household_member(a.household_id)
    )
  );
