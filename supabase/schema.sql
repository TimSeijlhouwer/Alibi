-- Dossier: Imposter — databaseschema
-- Plak dit in de SQL Editor van je Supabase-project en voer het uit.

create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  created_at timestamptz not null default now(),
  state jsonb not null default '{}'::jsonb
);

-- Prototype-beleid: iedereen (anon) mag lezen/schrijven.
-- LET OP: prima voor een testversie, niet voor productie.
alter table public.rooms enable row level security;

drop policy if exists "rooms_select" on public.rooms;
drop policy if exists "rooms_insert" on public.rooms;
drop policy if exists "rooms_update" on public.rooms;

create policy "rooms_select" on public.rooms for select using (true);
create policy "rooms_insert" on public.rooms for insert with check (true);
create policy "rooms_update" on public.rooms for update using (true) with check (true);

-- Atomische, race-vrije schrijfacties per speler
create or replace function public.join_room(p_room uuid, p_player_id text, p_player jsonb)
returns void language sql as $$
  update public.rooms
  set state = jsonb_set(state, array['players', p_player_id], p_player, true)
  where id = p_room;
$$;

create or replace function public.submit_answer(p_room uuid, p_phase text, p_player_id text, p_answer jsonb)
returns void language sql as $$
  update public.rooms
  set state = jsonb_set(
        jsonb_set(
          jsonb_set(state, array['answers'], coalesce(state->'answers', '{}'::jsonb), true),
          array['answers', p_phase], coalesce(state->'answers'->p_phase, '{}'::jsonb), true),
        array['answers', p_phase, p_player_id], p_answer, true)
  where id = p_room;
$$;

create or replace function public.set_flag(p_room uuid, p_key text, p_value jsonb)
returns void language sql as $$
  update public.rooms
  set state = jsonb_set(
        jsonb_set(state, array['flags'], coalesce(state->'flags', '{}'::jsonb), true),
        array['flags', p_key], p_value, true)
  where id = p_room;
$$;

-- Realtime aanzetten voor de rooms-tabel
do $$
begin
  alter publication supabase_realtime add table public.rooms;
exception when duplicate_object then null;
end $$;
