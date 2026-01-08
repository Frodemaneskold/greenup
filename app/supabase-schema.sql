-- Run this in Supabase SQL editor.
-- Competitions
create table if not exists public.competitions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  start_date date,
  end_date date,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Participants in a competition
create table if not exists public.competition_participants (
  competition_id uuid not null references public.competitions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (competition_id, user_id)
);

-- Fast aggregation by user/time
create index if not exists idx_user_actions_user_time on public.user_actions (user_id, created_at);
create index if not exists idx_user_actions_compound on public.user_actions (user_id, mission_id);

-- RLS
alter table public.competitions enable row level security;
alter table public.competition_participants enable row level security;

-- Policies: users can read competitions they participate in or created
create policy if not exists "read-participant-or-owner" on public.competitions
for select using (
  auth.uid() = created_by
  or exists (
    select 1 from public.competition_participants cp
    where cp.competition_id = competitions.id and cp.user_id = auth.uid()
  )
);

-- Creator can insert competitions
create policy if not exists "insert-owner" on public.competitions
for insert with check (auth.uid() = created_by);

-- Owner can update their competitions
create policy if not exists "update-owner" on public.competitions
for update using (auth.uid() = created_by);

-- Participants policies
create policy if not exists "read-participants" on public.competition_participants
for select using (
  auth.uid() = user_id
  or exists (
    select 1 from public.competitions c
    where c.id = competition_participants.competition_id and c.created_by = auth.uid()
  )
);

-- Users can join any visible competition (owner or invited flow can enforce externally)
create policy if not exists "insert-self" on public.competition_participants
for insert with check (auth.uid() = user_id);

-- Owner can add participants (for invite accept flows done server-side)
create policy if not exists "owner-adds" on public.competition_participants
for insert with check (
  exists (
    select 1 from public.competitions c
    where c.id = competition_participants.competition_id and c.created_by = auth.uid()
  )
);

-- Owner can remove participants
create policy if not exists "owner-removes" on public.competition_participants
for delete using (
  exists (
    select 1 from public.competitions c
    where c.id = competition_participants.competition_id and c.created_by = auth.uid()
  )
);

-- Realtime
-- Enable for tables: competitions, competition_participants, user_actions (already used)

-- === Profiles: background_key default and signup trigger ===
-- Ensure background_key exists and defaults to 'bg_02'
alter table if exists public.profiles
  add column if not exists background_key text;

-- Set default to 'bg_02'
alter table if exists public.profiles
  alter column background_key set default 'bg_02';

-- Backfill any existing NULLs to the default
update public.profiles
set background_key = 'bg_02'
where background_key is null;

-- Optional: constrain allowed values (bg_01..bg_07). Skip if already present.
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_background_key_allowed'
  ) then
    alter table public.profiles
      add constraint profiles_background_key_allowed
      check (background_key in ('bg_01','bg_02','bg_03','bg_04','bg_05','bg_06','bg_07'));
  end if;
end
$$;

-- Trigger: create profile on new auth.users with background_key = 'bg_02'
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username, full_name, background_key)
  values (
    new.id,
    coalesce(nullif(trim((new.raw_user_meta_data->>'username')::text), ''), null),
    coalesce(
      nullif(
        trim(
          coalesce((new.raw_user_meta_data->>'first_name')::text, '') || ' ' ||
          coalesce((new.raw_user_meta_data->>'last_name')::text, '')
        ),
        ''
      ),
      null
    ),
    'bg_02'
  )
  on conflict (id) do update
  set background_key = excluded.background_key
  where public.profiles.id = excluded.id
    and coalesce(public.profiles.background_key, '') = '';
  return new;
end;
$$;

-- Create trigger once
do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'create_profile_on_signup'
  ) then
    create trigger create_profile_on_signup
    after insert on auth.users
    for each row execute procedure public.handle_new_user();
  end if;
end
$$;

-- === Missions: quantity fields and specific mission setup ===
-- Add quantity fields with minimal schema changes
alter table if exists public.missions
  add column if not exists quantity_mode int,
  add column if not exists quantity_unit text,
  add column if not exists quantity_multiplier numeric;

-- Set quantity fields for the "panta burkar" mission
update public.missions
set
  quantity_mode = 1,
  quantity_unit = 'SEK',
  quantity_multiplier = 0.1
where lower(title) = 'panta burkar';


