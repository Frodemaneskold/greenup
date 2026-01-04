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


