-- =============================================================================
-- PulseTrack Phase 1A verification. Run each block separately in the SQL Editor
-- (the editor shows only the last result of a multi-statement run).
-- =============================================================================

-- 1. Tables exist with RLS enabled. Expect 7 rows, rls = true on all.
select c.relname as table_name, c.relrowsecurity as rls
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r'
order by 1;

-- 2. Policies. Expect NO policy granting anon anything on public tables.
select tablename, policyname, cmd, roles
from pg_policies where schemaname in ('public') order by tablename, policyname;

-- 3. Storage bucket. Expect emergency_media, public = false, 5242880, mime list.
select id, public, file_size_limit, allowed_mime_types from storage.buckets;

-- 4. Storage policies. Expect insert_own + select only (no update/delete).
select policyname, cmd from pg_policies
where schemaname = 'storage' and tablename = 'objects' and policyname like 'emergency_media%';

-- 5. Function execute rights. Expect:
--   claim_and_triage_incident, list_expired_media, purge_expired_emergency_data -> service_role only
--   acknowledge_incident, mark_incident_rescued, resolve_my_incident            -> authenticated
--   get_family_alert                                                            -> anon, authenticated
select p.proname,
       has_function_privilege('anon',          p.oid, 'execute') as anon,
       has_function_privilege('authenticated', p.oid, 'execute') as authenticated,
       has_function_privilege('service_role',  p.oid, 'execute') as service_role
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in ('claim_and_triage_incident','list_expired_media','purge_expired_emergency_data',
                    'acknowledge_incident','mark_incident_rescued','resolve_my_incident','get_family_alert')
order by 1;

-- 6. Realtime publication. Expect incidents_public and incident_media.
select tablename from pg_publication_tables
where pubname = 'supabase_realtime' and schemaname = 'public';

-- 7. Responder seeded. Expect 1 row (after running seed_responder.sql).
select r.display_name, u.email from public.responders r join auth.users u on u.id = r.user_id;

-- 8. Anonymous token hash sanity check: must return 64 lowercase hex chars.
--    (Matches the app: sha256 of the 64-char hex token string.)
select encode(extensions.digest('aa'::text, 'sha256'), 'hex') as sample_hash,
       length(encode(extensions.digest('aa'::text, 'sha256'), 'hex')) as len;

-- 9. Unknown token must return null (never an error, never data).
select public.get_family_alert(gen_random_uuid(), repeat('0', 64)) as should_be_null;
