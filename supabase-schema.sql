-- Profiles table (extends auth.users)
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  first_name text,
  last_name text,
  plan text not null default 'free' check (plan in ('free', 'starter', 'pro', 'business')),
  generations_used integer not null default 0,
  generations_limit integer not null default 3,
  generations_reset_at timestamptz default now(),
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at timestamptz default now()
);

-- Add first_name / last_name to existing tables (idempotent)
alter table public.profiles add column if not exists first_name text;
alter table public.profiles add column if not exists last_name text;

-- Add brand_profile and stripe idempotency column (idempotent)
alter table public.profiles add column if not exists brand_profile jsonb;
alter table public.profiles add column if not exists last_stripe_session_id text;

-- Generations history
create table if not exists public.generations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  product_name text not null,
  keywords text,
  category text,
  tone text,
  language text default 'fr',
  result jsonb,
  created_at timestamptz default now()
);

-- Auto-create profile on signup (stores first_name and last_name from metadata)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, first_name, last_name)
  values (
    new.id,
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name'
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Increment generations count
create or replace function public.increment_generations(user_id uuid)
returns void as $$
begin
  update public.profiles
  set generations_used = generations_used + 1
  where id = user_id;
end;
$$ language plpgsql security definer;

-- Add generations_limit to existing tables (idempotent)
alter table public.profiles add column if not exists generations_limit integer not null default 3;

-- Increment generations count by a given amount (bulk-safe)
create or replace function public.increment_generations_bulk(user_id uuid, amount integer)
returns void as $$
begin
  update public.profiles
  set generations_used = generations_used + amount
  where id = user_id;
end;
$$ language plpgsql security definer;

-- Atomic quota check + increment (prevents race conditions)
-- Returns true if the increment succeeded, false if quota exceeded
create or replace function public.check_and_increment_quota(p_user_id uuid, p_amount integer)
returns boolean as $$
declare
  v_used integer;
  v_limit integer;
begin
  -- Lock the row for this user to prevent concurrent updates
  select generations_used, generations_limit
  into v_used, v_limit
  from public.profiles
  where id = p_user_id
  for update;

  -- Check quota
  if v_used + p_amount > v_limit then
    return false;
  end if;

  -- Atomically increment
  update public.profiles
  set generations_used = generations_used + p_amount
  where id = p_user_id;

  return true;
end;
$$ language plpgsql security definer;


alter table public.profiles add column if not exists brand_profile jsonb;

create table if not exists public.bulk_jobs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  status text not null default 'pending' check (status in ('pending', 'processing', 'done', 'error')),
  total integer not null default 0,
  processed integer not null default 0,
  results jsonb not null default '[]',
  created_at timestamptz default now()
);

alter table public.bulk_jobs enable row level security;

create policy "Users can manage own bulk jobs"
  on public.bulk_jobs for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- RLS policies
alter table public.profiles enable row level security;
alter table public.generations enable row level security;

create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can read own generations"
  on public.generations for select
  using (auth.uid() = user_id);

create policy "Users can insert own generations"
  on public.generations for insert
  with check (auth.uid() = user_id);
