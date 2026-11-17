-- TabDin — schema inicial
-- Todas as tabelas usam Row Level Security: cada usuário só enxerga os próprios dados.

-- =========================================================
-- PROFILES
-- =========================================================
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  -- Cofre de senhas (zero-knowledge): o servidor só guarda o salt e um verificador cifrado.
  vault_salt text,
  vault_verifier text,
  vault_verifier_iv text,
  created_at timestamptz not null default now()
);

-- =========================================================
-- OPEN FINANCE CONNECTIONS
-- =========================================================
create table public.bank_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  provider text not null default 'pluggy' check (provider in ('pluggy', 'demo')),
  external_item_id text not null,
  institution_name text not null,
  institution_logo text,
  institution_color text,
  status text not null default 'active',
  last_sync_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, external_item_id)
);

-- =========================================================
-- ACCOUNTS
-- =========================================================
create table public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  connection_id uuid references public.bank_connections (id) on delete cascade,
  name text not null,
  institution text,
  type text not null default 'checking'
    check (type in ('checking', 'savings', 'credit', 'investment', 'wallet')),
  balance numeric(14, 2) not null default 0,
  currency text not null default 'BRL',
  color text not null default '#0A84FF',
  source text not null default 'manual' check (source in ('manual', 'open_finance')),
  external_id text,
  created_at timestamptz not null default now(),
  unique (user_id, external_id)
);

-- =========================================================
-- CATEGORIES
-- =========================================================
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null,
  type text not null check (type in ('income', 'expense')),
  color text not null default '#0A84FF',
  icon text not null default 'tag',
  created_at timestamptz not null default now(),
  unique (user_id, name, type)
);

-- =========================================================
-- TRANSACTIONS
-- =========================================================
create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  account_id uuid not null references public.accounts (id) on delete cascade,
  category_id uuid references public.categories (id) on delete set null,
  description text not null,
  amount numeric(14, 2) not null check (amount >= 0),
  type text not null check (type in ('income', 'expense')),
  date date not null default current_date,
  notes text,
  source text not null default 'manual' check (source in ('manual', 'open_finance')),
  external_id text,
  created_at timestamptz not null default now(),
  unique (user_id, external_id)
);

create index transactions_user_date_idx on public.transactions (user_id, date desc);
create index transactions_account_idx on public.transactions (account_id);
create index transactions_category_idx on public.transactions (category_id);
create index accounts_user_idx on public.accounts (user_id);
create index accounts_connection_idx on public.accounts (connection_id);
create index categories_user_idx on public.categories (user_id);
create index bank_connections_user_idx on public.bank_connections (user_id);

-- =========================================================
-- BUDGETS (orçamento mensal por categoria)
-- =========================================================
create table public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete cascade,
  amount numeric(14, 2) not null check (amount > 0),
  created_at timestamptz not null default now(),
  unique (user_id, category_id)
);
create index budgets_category_idx on public.budgets (category_id);

-- =========================================================
-- VAULT (gerenciador de senhas: logins e cartões)
-- O conteúdo é cifrado no navegador com AES-256-GCM. O banco só vê ciphertext.
-- =========================================================
create table public.vault_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind text not null check (kind in ('login', 'card')),
  ciphertext text not null,
  iv text not null,
  favorite boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index vault_items_user_idx on public.vault_items (user_id);

-- =========================================================
-- RLS
-- =========================================================
alter table public.profiles enable row level security;
alter table public.bank_connections enable row level security;
alter table public.accounts enable row level security;
alter table public.categories enable row level security;
alter table public.transactions enable row level security;
alter table public.budgets enable row level security;
alter table public.vault_items enable row level security;

create policy "profiles_select_own" on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy "profiles_update_own" on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

do $$
declare t text;
begin
  foreach t in array array['bank_connections','accounts','categories','transactions','budgets','vault_items'] loop
    execute format('create policy "%1$s_select_own" on public.%1$I for select to authenticated using ((select auth.uid()) = user_id)', t);
    execute format('create policy "%1$s_insert_own" on public.%1$I for insert to authenticated with check ((select auth.uid()) = user_id)', t);
    execute format('create policy "%1$s_update_own" on public.%1$I for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)', t);
    execute format('create policy "%1$s_delete_own" on public.%1$I for delete to authenticated using ((select auth.uid()) = user_id)', t);
  end loop;
end $$;

-- =========================================================
-- Novo usuário → cria perfil + categorias padrão
-- =========================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)));

  insert into public.categories (user_id, name, type, color, icon) values
    (new.id, 'Salário',       'income',  '#30D158', 'briefcase'),
    (new.id, 'Investimentos', 'income',  '#64D2FF', 'trending-up'),
    (new.id, 'Outras receitas','income', '#5E5CE6', 'plus-circle'),
    (new.id, 'Alimentação',   'expense', '#FF9F0A', 'utensils'),
    (new.id, 'Moradia',       'expense', '#0A84FF', 'home'),
    (new.id, 'Transporte',    'expense', '#5AC8FA', 'car'),
    (new.id, 'Saúde',         'expense', '#FF453A', 'heart-pulse'),
    (new.id, 'Lazer',         'expense', '#BF5AF2', 'gamepad-2'),
    (new.id, 'Educação',      'expense', '#FFD60A', 'graduation-cap'),
    (new.id, 'Compras',       'expense', '#FF375F', 'shopping-bag'),
    (new.id, 'Assinaturas',   'expense', '#7D7AFF', 'repeat'),
    (new.id, 'Outros',        'expense', '#8E8E93', 'tag');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =========================================================
-- Saldo de contas manuais acompanha as transações
-- =========================================================
create or replace function public.apply_transaction_to_balance()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if tg_op in ('UPDATE', 'DELETE') and old.source = 'manual' then
    update public.accounts
       set balance = balance - case when old.type = 'income' then old.amount else -old.amount end
     where id = old.account_id and source = 'manual';
  end if;
  if tg_op in ('INSERT', 'UPDATE') and new.source = 'manual' then
    update public.accounts
       set balance = balance + case when new.type = 'income' then new.amount else -new.amount end
     where id = new.account_id and source = 'manual';
  end if;
  return coalesce(new, old);
end;
$$;

create trigger transactions_balance
  after insert or update or delete on public.transactions
  for each row execute function public.apply_transaction_to_balance();

-- updated_at do cofre
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger vault_items_touch
  before update on public.vault_items
  for each row execute function public.touch_updated_at();

revoke execute on function public.handle_new_user() from public, anon, authenticated;
