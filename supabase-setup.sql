-- Run this in your Supabase SQL editor to set up the database

create table if not exists public.user_data (
  user_id uuid references auth.users(id) on delete cascade primary key,
  data    jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

-- Only authenticated users can read/write their own row
alter table public.user_data enable row level security;

create policy "Users can read own data"
  on public.user_data for select to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert own data"
  on public.user_data for insert to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update own data"
  on public.user_data for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own data"
  on public.user_data for delete to authenticated
  using (auth.uid() = user_id);
