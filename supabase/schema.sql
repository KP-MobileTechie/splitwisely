-- splitwisely schema + Row-Level Security
-- One-time owner setup:
--   1. Create a free Supabase project.
--   2. Paste and run this whole file in the SQL editor.
--   3. Authentication > Providers > enable the Email provider (magic link).
--   4. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY locally and in Vercel.
--
-- RLS model (v1): creator-owns-group. A user can see and mutate only the
-- groups they created, and the members/expenses/splits beneath them.
-- Multi-user shared groups are a v2 concern.

-- Money is stored as integer cents everywhere. Never floats.

create table if not exists groups (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 80),
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references groups (id) on delete cascade,
  user_id uuid references auth.users (id) on delete set null,
  display_name text not null check (char_length(display_name) between 1 and 60),
  created_at timestamptz not null default now()
);

create table if not exists expenses (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references groups (id) on delete cascade,
  description text not null check (char_length(description) between 1 and 120),
  amount_cents integer not null check (amount_cents > 0),
  paid_by uuid not null references group_members (id) on delete cascade,
  split_kind text not null check (split_kind in ('equal', 'exact')),
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists expense_splits (
  id uuid primary key default gen_random_uuid(),
  expense_id uuid not null references expenses (id) on delete cascade,
  member_id uuid not null references group_members (id) on delete cascade,
  amount_cents integer not null check (amount_cents >= 0)
);

create index if not exists idx_group_members_group on group_members (group_id);
create index if not exists idx_expenses_group on expenses (group_id);
create index if not exists idx_expense_splits_expense on expense_splits (expense_id);

-- Enable RLS on every table.
alter table groups enable row level security;
alter table group_members enable row level security;
alter table expenses enable row level security;
alter table expense_splits enable row level security;

-- A helper: does the current user own this group?
create or replace function owns_group(gid uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from groups g
    where g.id = gid and g.created_by = auth.uid()
  );
$$;

-- groups: creator owns.
drop policy if exists groups_owner on groups;
create policy groups_owner on groups
  for all
  using (created_by = auth.uid())
  with check (created_by = auth.uid());

-- group_members: through the owning group.
drop policy if exists group_members_owner on group_members;
create policy group_members_owner on group_members
  for all
  using (owns_group(group_id))
  with check (owns_group(group_id));

-- expenses: through the owning group.
drop policy if exists expenses_owner on expenses;
create policy expenses_owner on expenses
  for all
  using (owns_group(group_id))
  with check (owns_group(group_id));

-- expense_splits: through the expense's owning group.
drop policy if exists expense_splits_owner on expense_splits;
create policy expense_splits_owner on expense_splits
  for all
  using (
    exists (
      select 1 from expenses e
      where e.id = expense_id and owns_group(e.group_id)
    )
  )
  with check (
    exists (
      select 1 from expenses e
      where e.id = expense_id and owns_group(e.group_id)
    )
  );
