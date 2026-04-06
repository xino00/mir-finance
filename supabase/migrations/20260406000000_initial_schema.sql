-- user_data: stores the full app state per user as a JSONB blob
create table if not exists public.user_data (
  user_id    uuid references auth.users(id) on delete cascade primary key,
  data       jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

-- Row Level Security: each authenticated user can only access their own row
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
