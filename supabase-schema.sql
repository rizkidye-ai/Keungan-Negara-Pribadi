-- ============================================================
-- Keuangan TMRIZK — skema database Supabase
-- Jalankan seluruh isi file ini di: Supabase Dashboard > SQL Editor > New query
-- Aman dijalankan berkali-kali (pakai "if not exists" / "drop policy if exists").
-- ============================================================

create extension if not exists pgcrypto;

-- ---------- akun / dompet ----------
create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  type text not null check (type in ('cash','bank','ewallet','lainnya')),
  initial_balance numeric not null default 0,
  created_at timestamptz not null default now()
);
alter table public.accounts enable row level security;
drop policy if exists "own accounts" on public.accounts;
create policy "own accounts" on public.accounts for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------- target tabungan ----------
create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  target_amount numeric not null check (target_amount > 0),
  target_date date,
  created_at timestamptz not null default now()
);
alter table public.goals enable row level security;
drop policy if exists "own goals" on public.goals;
create policy "own goals" on public.goals for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------- transaksi ----------
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  account_id uuid not null references public.accounts(id) on delete cascade,
  to_account_id uuid references public.accounts(id) on delete set null,
  goal_id uuid references public.goals(id) on delete set null,
  type text not null check (type in ('pemasukan','pengeluaran','transfer')),
  category text not null default '',
  amount numeric not null check (amount > 0),
  note text default '',
  date date not null default current_date,
  created_at timestamptz not null default now()
);
create index if not exists tx_user_date_idx on public.transactions(user_id, date desc);
create index if not exists tx_account_idx on public.transactions(account_id);
create index if not exists tx_goal_idx on public.transactions(goal_id);
alter table public.transactions enable row level security;
drop policy if exists "own transactions" on public.transactions;
create policy "own transactions" on public.transactions for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------- anggaran / budget per kategori ----------
create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null,
  limit_amount numeric not null check (limit_amount > 0),
  created_at timestamptz not null default now(),
  unique (user_id, category)
);
alter table public.budgets enable row level security;
drop policy if exists "own budgets" on public.budgets;
create policy "own budgets" on public.budgets for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------- transaksi berulang (tagihan/langganan rutin) ----------
create table if not exists public.recurring (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  account_id uuid not null references public.accounts(id) on delete cascade,
  type text not null check (type in ('pemasukan','pengeluaran')),
  category text not null,
  amount numeric not null check (amount > 0),
  note text default '',
  day_of_month int not null check (day_of_month between 1 and 28),
  active boolean not null default true,
  last_generated text,
  created_at timestamptz not null default now()
);
alter table public.recurring enable row level security;
drop policy if exists "own recurring" on public.recurring;
create policy "own recurring" on public.recurring for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
