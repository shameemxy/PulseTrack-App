-- =============================================================================
-- PulseTrack canonical schema v1  (Phase 1A)            Project: PulseTrackApp
-- Run in: Supabase Dashboard > SQL Editor (project uchskguarketvgzapvsb).
--
-- Replaces the drifted live schema (verified 2026-11-22: both incident tables
-- had 0 rows, no storage buckets, no migrations tracked, anon could read every
-- incident, claim_and_triage_incident was anon-executable).
--
-- Safe to re-run while the incident tables are empty. Once real incidents exist
-- the guard below aborts the destructive rebuild instead of deleting data.
-- Prerequisite (Dashboard): Authentication > Sign In / Providers >
--   enable "Allow anonymous sign-ins" and keep the Email provider enabled.
-- =============================================================================

begin;

-- 0. Guard: never destroy real incident data ----------------------------------
do $$
begin
  if to_regclass('public.incidents_public') is not null then
    if exists (select 1 from public.incidents_public limit 1) then
      raise exception 'incidents_public contains rows - refusing destructive rebuild';
    end if;
  end if;
  if to_regclass('public.incidents_private') is not null then
    if exists (select 1 from public.incidents_private limit 1) then
      raise exception 'incidents_private contains rows - refusing destructive rebuild';
    end if;
  end if;
end
$$;

-- 1. Remove drifted objects ---------------------------------------------------
drop function if exists public.claim_and_triage_incident(uuid);
drop function if exists public.claim_and_triage_incident(uuid, integer, text, text, text);
drop function if exists public.purge_expired_emergency_data();
drop function if exists public.purge_expired_emergency_data(integer);
drop table if exists public.incident_media cascade;
drop table if exists public.family_links cascade;
drop table if exists public.incidents_private cascade;
drop table if exists public.incidents_public cascade;

-- 2. Shared helper ------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end
$$;

-- 3. Identity & profile tables (kept across re-runs) ---------------------------
create table if not exists public.responders (
  user_id      uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 80),
  created_at   timestamptz not null default now()
);

create table if not exists public.user_profiles (
  user_id       uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  full_name     text not null default '' check (char_length(full_name) <= 80),
  blood_group   text check (blood_group in ('A+','A-','B+','B-','AB+','AB-','O+','O-')),
  medical_notes text check (char_length(medical_notes) <= 500),
  updated_at    timestamptz not null default now()
);

create table if not exists public.emergency_contacts (
  id           uuid primary key,
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name         text not null check (char_length(name) between 1 and 80),
  relationship text check (char_length(relationship) <= 40),
  phone        text not null check (phone ~ '^\+?[0-9]{5,15}$'),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists emergency_contacts_user_idx on public.emergency_contacts (user_id);

drop trigger if exists user_profiles_touch on public.user_profiles;
create trigger user_profiles_touch before update on public.user_profiles
  for each row execute function public.touch_updated_at();

drop trigger if exists emergency_contacts_touch on public.emergency_contacts;
create trigger emergency_contacts_touch before update on public.emergency_contacts
  for each row execute function public.touch_updated_at();

-- 4. Incident tables ----------------------------------------------------------
-- The client generates the incident id (uuid v4) so offline-queued inserts are
-- idempotent: a retry that hits the primary key (23505) means "already stored".
create table public.incidents_public (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null default auth.uid() references auth.users (id) on delete cascade,
  latitude          double precision check (latitude  between -90  and 90),
  longitude         double precision check (longitude between -180 and 180),
  altitude          double precision,
  accuracy          double precision,
  battery_pct       integer check (battery_pct between 0 and 100),
  impact_g          double precision,
  audio_db          double precision,
  mode              text not null default 'default'
                      check (mode in ('default','travel_solo','travel_multiple','disaster')),
  trigger_reason    text check (char_length(trigger_reason) <= 80),
  status            text not null default 'active'
                      check (status in ('active','acknowledged','rescued','resolved')),
  transmission_tier text not null default 'tier1_internet'
                      check (transmission_tier in ('tier1_internet','tier2_sms','tier3_ble')),
  trapped_count     integer not null default 1 check (trapped_count between 1 and 999),
  claim_version     integer not null default 0,
  claimed_by_ai     text,
  acknowledged_by   uuid references auth.users (id) on delete set null,
  acknowledged_at   timestamptz,
  rescued_at        timestamptz,
  resolved_at       timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index incidents_public_status_idx on public.incidents_public (status, created_at desc);
create index incidents_public_user_idx   on public.incidents_public (user_id);

create trigger incidents_public_touch before update on public.incidents_public
  for each row execute function public.touch_updated_at();

create table public.incidents_private (
  incident_id   uuid primary key references public.incidents_public (id) on delete cascade,
  user_id       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  victim_name   text not null check (char_length(victim_name) between 1 and 80),
  blood_group   text,
  medical_notes text,
  ice_contacts  jsonb not null default '[]'::jsonb,
  ai_status     text not null default 'pending'
                  check (ai_status in ('pending','processing','complete','failed')),
  ai_summary    text,
  ai_priority   text check (ai_priority in ('critical','high','medium','low')),
  locked_at     timestamptz,
  created_at    timestamptz not null default now()
);

create table public.incident_media (
  id                uuid primary key default gen_random_uuid(),
  incident_id       uuid not null references public.incidents_public (id) on delete cascade,
  user_id           uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind              text not null check (kind in ('audio','video','photo')),
  -- Path convention: <user_id>/<incident_id>/<epoch_ms>-<kind>.<ext>
  storage_path      text not null unique,
  mime_type         text,
  duration_ms       integer check (duration_ms >= 0),
  transcript        text,
  transcript_status text not null default 'pending'
                      check (transcript_status in ('pending','processing','complete','failed','not_applicable')),
  captured_at       timestamptz not null default now(),
  -- Set by the purge Edge Function ONLY after the object was removed through
  -- the Storage API. Deleting storage.objects rows via SQL leaves the blob
  -- behind, so purge_expired_emergency_data() refuses rows with this unset.
  storage_removed_at timestamptz,
  created_at        timestamptz not null default now()
);
create index incident_media_incident_idx on public.incident_media (incident_id, captured_at);

create table public.family_links (
  id             uuid primary key default gen_random_uuid(),
  incident_id    uuid not null references public.incidents_public (id) on delete cascade,
  user_id        uuid not null default auth.uid() references auth.users (id) on delete cascade,
  -- sha256 hex of the 64-char hex token (32 random bytes). The raw token only
  -- ever exists on the victim's phone and inside the link sent to contacts.
  token_hash     text not null check (token_hash ~ '^[0-9a-f]{64}$'),
  expires_at     timestamptz not null default now() + interval '72 hours',
  revoked_at     timestamptz,
  last_opened_at timestamptz,
  created_at     timestamptz not null default now(),
  unique (incident_id, token_hash)
);

-- 5. Privileges (deny by default, then grant exactly what the app needs) ------
revoke all on public.incidents_public, public.incidents_private, public.incident_media,
              public.family_links, public.emergency_contacts, public.user_profiles,
              public.responders
  from anon, authenticated;

grant select, insert on public.incidents_public to authenticated;
-- Telemetry columns only. Status/claim/ack fields change through RPCs below.
grant update (latitude, longitude, altitude, accuracy, battery_pct, impact_g,
              audio_db, trapped_count, transmission_tier, mode)
  on public.incidents_public to authenticated;

grant select, insert on public.incidents_private to authenticated;
grant select, insert on public.incident_media    to authenticated;
grant select, insert on public.family_links      to authenticated;
grant update (revoked_at) on public.family_links to authenticated;
grant select, insert, update, delete on public.emergency_contacts to authenticated;
grant select, insert, update on public.user_profiles to authenticated;
grant select on public.responders to authenticated;

-- 6. Row Level Security -------------------------------------------------------
alter table public.responders         enable row level security;
alter table public.user_profiles      enable row level security;
alter table public.emergency_contacts enable row level security;
alter table public.incidents_public   enable row level security;
alter table public.incidents_private  enable row level security;
alter table public.incident_media     enable row level security;
alter table public.family_links       enable row level security;

-- responders: a user can see only their own row. Rows are seeded by the project
-- owner in the SQL editor (see supabase/seed/seed_responder.sql).
drop policy if exists responders_select_self on public.responders;
create policy responders_select_self on public.responders
  for select to authenticated
  using (user_id = (select auth.uid()));

-- user_profiles / emergency_contacts: owner only
drop policy if exists user_profiles_select on public.user_profiles;
drop policy if exists user_profiles_insert on public.user_profiles;
drop policy if exists user_profiles_update on public.user_profiles;
create policy user_profiles_select on public.user_profiles
  for select to authenticated using (user_id = (select auth.uid()));
create policy user_profiles_insert on public.user_profiles
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy user_profiles_update on public.user_profiles
  for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

drop policy if exists emergency_contacts_select on public.emergency_contacts;
drop policy if exists emergency_contacts_insert on public.emergency_contacts;
drop policy if exists emergency_contacts_update on public.emergency_contacts;
drop policy if exists emergency_contacts_delete on public.emergency_contacts;
create policy emergency_contacts_select on public.emergency_contacts
  for select to authenticated using (user_id = (select auth.uid()));
create policy emergency_contacts_insert on public.emergency_contacts
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy emergency_contacts_update on public.emergency_contacts
  for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy emergency_contacts_delete on public.emergency_contacts
  for delete to authenticated using (user_id = (select auth.uid()));

-- incidents_public: owner or responder reads; owner creates fresh 'active' rows
create policy incidents_public_select on public.incidents_public
  for select to authenticated
  using (
    user_id = (select auth.uid())
    or exists (select 1 from public.responders r where r.user_id = (select auth.uid()))
  );
create policy incidents_public_insert on public.incidents_public
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and status = 'active'
    and claim_version = 0
    and claimed_by_ai is null
    and acknowledged_by is null
    and acknowledged_at is null
    and rescued_at is null
    and resolved_at is null
  );
create policy incidents_public_update_own on public.incidents_public
  for update to authenticated
  using (user_id = (select auth.uid()) and status in ('active','acknowledged'))
  with check (user_id = (select auth.uid()));

-- incidents_private
create policy incidents_private_select on public.incidents_private
  for select to authenticated
  using (
    user_id = (select auth.uid())
    or exists (select 1 from public.responders r where r.user_id = (select auth.uid()))
  );
create policy incidents_private_insert on public.incidents_private
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and ai_status = 'pending'
    and ai_summary is null
    and ai_priority is null
    and locked_at is null
    and exists (
      select 1 from public.incidents_public p
      where p.id = incident_id and p.user_id = (select auth.uid())
    )
  );

-- incident_media
create policy incident_media_select on public.incident_media
  for select to authenticated
  using (
    user_id = (select auth.uid())
    or exists (select 1 from public.responders r where r.user_id = (select auth.uid()))
  );
create policy incident_media_insert on public.incident_media
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and transcript is null
    and transcript_status in ('pending','not_applicable')
    and storage_removed_at is null
    and storage_path like (select auth.uid())::text || '/' || incident_id::text || '/%'
    and exists (
      select 1 from public.incidents_public p
      where p.id = incident_id and p.user_id = (select auth.uid())
    )
  );

-- family_links (owner creates/revokes; family reads only via get_family_alert)
create policy family_links_select on public.family_links
  for select to authenticated using (user_id = (select auth.uid()));
create policy family_links_insert on public.family_links
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and revoked_at is null
    and last_opened_at is null
    and expires_at <= now() + interval '7 days'
    and exists (
      select 1 from public.incidents_public p
      where p.id = incident_id and p.user_id = (select auth.uid())
    )
  );
create policy family_links_revoke on public.family_links
  for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- 7. Storage bucket + policies ------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'emergency_media', 'emergency_media', false, 5242880,
  array['audio/mp4','audio/m4a','audio/x-m4a','audio/aac','audio/mpeg','audio/wav',
        'audio/x-wav','audio/3gpp','audio/webm','video/mp4','video/quicktime',
        'image/jpeg','image/png']
)
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists emergency_media_insert_own on storage.objects;
drop policy if exists emergency_media_select on storage.objects;

-- Uploads must land in <auth.uid()>/... ; no client UPDATE/DELETE policies exist,
-- so a stored object cannot be overwritten or removed by the app.
create policy emergency_media_insert_own on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'emergency_media'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
create policy emergency_media_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'emergency_media'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or exists (select 1 from public.responders r where r.user_id = (select auth.uid()))
    )
  );

-- 8. RPCs ---------------------------------------------------------------------
-- 8a. Responder / victim state transitions (the only way status can change)
create or replace function public.acknowledge_incident(p_incident_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_status text;
begin
  if not exists (select 1 from public.responders where user_id = v_uid) then
    return jsonb_build_object('success', false, 'code', 'NOT_RESPONDER');
  end if;
  update public.incidents_public
     set status = 'acknowledged', acknowledged_by = v_uid, acknowledged_at = now()
   where id = p_incident_id and status = 'active'
  returning status into v_status;
  if not found then
    return jsonb_build_object('success', false, 'code', 'NOT_ACTIVE');
  end if;
  return jsonb_build_object('success', true, 'status', v_status);
end
$$;

create or replace function public.mark_incident_rescued(p_incident_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_status text;
begin
  if not exists (select 1 from public.responders where user_id = v_uid) then
    return jsonb_build_object('success', false, 'code', 'NOT_RESPONDER');
  end if;
  update public.incidents_public
     set status = 'rescued', rescued_at = now(),
         acknowledged_by = coalesce(acknowledged_by, v_uid),
         acknowledged_at = coalesce(acknowledged_at, now())
   where id = p_incident_id and status in ('active','acknowledged')
  returning status into v_status;
  if not found then
    return jsonb_build_object('success', false, 'code', 'NOT_OPEN');
  end if;
  return jsonb_build_object('success', true, 'status', v_status);
end
$$;

create or replace function public.resolve_my_incident(p_incident_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_status text;
begin
  update public.incidents_public
     set status = 'resolved', resolved_at = now()
   where id = p_incident_id and user_id = v_uid and status in ('active','acknowledged')
  returning status into v_status;
  if not found then
    return jsonb_build_object('success', false, 'code', 'NOT_OPEN');
  end if;
  return jsonb_build_object('success', true, 'status', v_status);
end
$$;

revoke all on function public.acknowledge_incident(uuid)    from public, anon, authenticated;
revoke all on function public.mark_incident_rescued(uuid)   from public, anon, authenticated;
revoke all on function public.resolve_my_incident(uuid)     from public, anon, authenticated;
grant execute on function public.acknowledge_incident(uuid)  to authenticated;
grant execute on function public.mark_incident_rescued(uuid) to authenticated;
grant execute on function public.resolve_my_incident(uuid)   to authenticated;

-- 8b. AI triage claim: optimistic locking on claim_version. service_role only
-- (called by the triage Edge Function in Phase 3, never by the phone).
create or replace function public.claim_and_triage_incident(
  p_incident_id     uuid,
  p_current_version integer,
  p_ai_worker_id    text,
  p_ai_summary      text,
  p_priority        text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_new integer;
begin
  if p_priority not in ('critical','high','medium','low') then
    return jsonb_build_object('success', false, 'code', 'BAD_PRIORITY');
  end if;
  update public.incidents_public
     set claim_version = claim_version + 1, claimed_by_ai = p_ai_worker_id
   where id = p_incident_id and claim_version = p_current_version
  returning claim_version into v_new;
  if not found then
    return jsonb_build_object('success', false, 'code', 'VERSION_CONFLICT',
                              'message', 'Incident was claimed or changed by another worker');
  end if;
  update public.incidents_private
     set ai_summary = p_ai_summary, ai_priority = p_priority,
         ai_status = 'complete', locked_at = now()
   where incident_id = p_incident_id;
  return jsonb_build_object('success', true, 'newVersion', v_new);
end
$$;

revoke all on function public.claim_and_triage_incident(uuid, integer, text, text, text)
  from public, anon, authenticated;
grant execute on function public.claim_and_triage_incident(uuid, integer, text, text, text)
  to service_role;

-- 8c. Family live-alert read. Token-gated, anon-callable by design: this is the
-- only door for the unauthenticated /alert/[incidentId]?token=... page.
create or replace function public.get_family_alert(p_incident_id uuid, p_token text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_link   public.family_links;
  v_result jsonb;
begin
  if p_token is null or p_token !~ '^[0-9a-f]{64}$' then
    return null;
  end if;

  select * into v_link
    from public.family_links
   where incident_id = p_incident_id
     and token_hash = encode(extensions.digest(p_token, 'sha256'), 'hex')
     and revoked_at is null
     and expires_at > now();
  if not found then
    return null;
  end if;

  update public.family_links set last_opened_at = now() where id = v_link.id;

  select jsonb_build_object(
    'incident', jsonb_build_object(
      'id', i.id, 'status', i.status, 'mode', i.mode,
      'latitude', i.latitude, 'longitude', i.longitude, 'accuracy', i.accuracy,
      'battery_pct', i.battery_pct, 'transmission_tier', i.transmission_tier,
      'created_at', i.created_at, 'updated_at', i.updated_at,
      'acknowledged_at', i.acknowledged_at, 'rescued_at', i.rescued_at
    ),
    'victim', jsonb_build_object(
      'name', p.victim_name, 'blood_group', p.blood_group,
      'medical_notes', p.medical_notes
    ),
    'triage', jsonb_build_object('priority', p.ai_priority, 'summary', p.ai_summary),
    'media', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', m.id, 'kind', m.kind, 'storage_path', m.storage_path,
               'transcript', m.transcript, 'transcript_status', m.transcript_status,
               'captured_at', m.captured_at) order by m.captured_at)
        from public.incident_media m
       where m.incident_id = i.id
    ), '[]'::jsonb)
  ) into v_result
  from public.incidents_public i
  join public.incidents_private p on p.incident_id = i.id
  where i.id = p_incident_id;

  return v_result;
end
$$;

revoke all on function public.get_family_alert(uuid, text) from public, anon, authenticated;
grant execute on function public.get_family_alert(uuid, text) to anon, authenticated;

-- 8d. Retention (72 h). Two-step by design to avoid orphaned storage blobs:
--   1. Edge Function calls list_expired_media(), removes each path through the
--      Storage API, then marks incident_media.storage_removed_at.
--   2. Edge Function calls purge_expired_emergency_data(), which only deletes
--      incidents whose media has all been removed from storage.
create or replace function public.list_expired_media(p_hours integer default 72)
returns table (media_id uuid, storage_path text)
language sql
security definer
set search_path = ''
as $$
  select m.id, m.storage_path
    from public.incident_media m
    join public.incidents_public i on i.id = m.incident_id
   where i.created_at < now() - make_interval(hours => p_hours)
     and m.storage_removed_at is null
$$;

create or replace function public.purge_expired_emergency_data(p_hours integer default 72)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_deleted integer;
begin
  with doomed as (
    select i.id
      from public.incidents_public i
     where i.created_at < now() - make_interval(hours => p_hours)
       and not exists (
         select 1 from public.incident_media m
          where m.incident_id = i.id and m.storage_removed_at is null
       )
  ), del as (
    delete from public.incidents_public
     where id in (select id from doomed)
    returning 1
  )
  select count(*) into v_deleted from del;
  return v_deleted;
end
$$;

revoke all on function public.list_expired_media(integer)             from public, anon, authenticated;
revoke all on function public.purge_expired_emergency_data(integer)   from public, anon, authenticated;
grant execute on function public.list_expired_media(integer)           to service_role;
grant execute on function public.purge_expired_emergency_data(integer) to service_role;

-- 9. Realtime (RLS still applies: responders see all, victims see their own) ---
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (
      select 1 from pg_publication_tables
       where pubname = 'supabase_realtime' and schemaname = 'public'
         and tablename = 'incidents_public'
    ) then
      alter publication supabase_realtime add table public.incidents_public;
    end if;
    if not exists (
      select 1 from pg_publication_tables
       where pubname = 'supabase_realtime' and schemaname = 'public'
         and tablename = 'incident_media'
    ) then
      alter publication supabase_realtime add table public.incident_media;
    end if;
  end if;
end
$$;

commit;
