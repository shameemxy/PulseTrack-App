-- =============================================================================
-- PulseTrack: seed ONE responder demo account (Phase 1A)
--
-- Step 1 (Dashboard, no SQL): Authentication > Users > Add user > Create new user
--   - Email: your own demo address (e.g. responder@<your-domain>)
--   - Password: choose one yourself, store it in your password manager
--   - Tick "Auto Confirm User"
--   The password is never written to this repo or to chat.
--
-- Step 2: put that exact email below and run this script in the SQL Editor.
-- =============================================================================

do $$
declare
  v_email text := 'REPLACE_WITH_YOUR_RESPONDER_EMAIL';
  v_name  text := 'Command Center Demo Responder';
  v_uid   uuid;
begin
  if v_email = 'REPLACE_WITH_YOUR_RESPONDER_EMAIL' then
    raise exception 'Edit v_email first.';
  end if;

  select id into v_uid from auth.users where lower(email) = lower(v_email);
  if v_uid is null then
    raise exception 'No auth user with email %. Create it in Authentication > Users first.', v_email;
  end if;

  insert into public.responders (user_id, display_name)
  values (v_uid, v_name)
  on conflict (user_id) do update set display_name = excluded.display_name;

  raise notice 'Responder seeded for user %', v_uid;
end
$$;
