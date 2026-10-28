-- RLS / privilege test suite. Run by supabase/tests/run-local-postgres.sh.
-- Every block raises an exception on failure; psql runs with ON_ERROR_STOP.

\set QUIET on
\echo '== RLS test suite'

-- Fixture helpers (test-only) -----------------------------------------------------
create schema if not exists tests;
create or replace function tests.act_as(p_user uuid) returns void language plpgsql as $$
begin
  if p_user is null then
    perform set_config('role', 'anon', true);
    perform set_config('request.jwt.claims', '', true);
  else
    perform set_config('role', 'authenticated', true);
    perform set_config('request.jwt.claims', json_build_object('sub', p_user, 'role', 'authenticated')::text, true);
  end if;
end $$;
grant usage on schema tests to anon, authenticated;
grant execute on all functions in schema tests to anon, authenticated;

create or replace function tests.assert(cond boolean, msg text) returns void language plpgsql as $$
begin
  if cond is distinct from true then raise exception 'ASSERTION FAILED: %', msg; end if;
  raise notice 'ok - %', msg;
end $$;
grant execute on function tests.assert(boolean, text) to anon, authenticated;

-- Catalog fixture (as superuser, mimicking service_role ingestion)
insert into catalog.data_sources (id, slug, name, kind)
  values ('00000000-0000-0000-0000-0000000000d5', 'dev-fixture', 'Development fixture', 'manual');
insert into catalog.card_sets (id, name, source_id) values ('DEV', 'Dev Sample Set', '00000000-0000-0000-0000-0000000000d5');
insert into catalog.cards (id, set_id, number, name, supertype)
  select 'DEV-' || lpad(n::text, 3, '0'), 'DEV', n::text, 'Sample Card ' || n, 'pokemon'
  from generate_series(1, 15) n;
insert into catalog.archetypes (id, slug, name) values ('00000000-0000-0000-0000-0000000000a1', 'sample-archetype', 'Sample Archetype');

-- Users (inserting into auth.users fires handle_new_user)
insert into auth.users (id, email, raw_user_meta_data) values
  ('11111111-1111-1111-1111-111111111111', 'a@example.test', '{"username":"alice_a"}'),
  ('22222222-2222-2222-2222-222222222222', 'b@example.test', '{"username":"ALICE_A"}'),   -- case-insensitive clash
  ('33333333-3333-3333-3333-333333333333', 'c@example.test', '{"username":"bad name!"}');  -- invalid

-- 1. Profile initialisation ------------------------------------------------------
select tests.assert((select username::text from public.profiles where id = '11111111-1111-1111-1111-111111111111') = 'alice_a',
  'signup uses requested username');
select tests.assert((select username::text from public.profiles where id = '22222222-2222-2222-2222-222222222222') like 'trainer\_%',
  'case-insensitive username clash falls back to generated handle');
select tests.assert((select username::text from public.profiles where id = '33333333-3333-3333-3333-333333333333') like 'trainer\_%',
  'invalid requested username falls back to generated handle');
select tests.assert((select count(*) from public.user_preferences) = 3, 'preferences row created per user');
select tests.assert(not exists (
    select 1 from information_schema.columns
     where table_schema = 'public' and column_name in ('email', 'phone')),
  'no email/phone columns are copied into public schema');

update public.profiles set visibility = 'public' where id = '22222222-2222-2222-2222-222222222222';

-- 2. Profiles visibility ---------------------------------------------------------
begin;
select tests.act_as(null);
select tests.assert((select count(*) from public.profiles) = 1, 'anon sees only public profiles');
rollback;

begin;
select tests.act_as('11111111-1111-1111-1111-111111111111');
select tests.assert((select count(*) from public.profiles) = 2, 'user sees own + public profiles');
select tests.assert((select count(*) from public.user_preferences) = 1, 'user sees only own preferences');
with u as (update public.profiles set bio = 'hacked' where id = '22222222-2222-2222-2222-222222222222' returning 1)
select tests.assert((select count(*) from u) = 0, 'user cannot update another profile');
with u as (update public.user_preferences set theme = 'light' where user_id = '22222222-2222-2222-2222-222222222222' returning 1)
select tests.assert((select count(*) from u) = 0, 'user cannot update another user''s preferences');
with u as (update public.profiles set bio = 'Hello' where id = '11111111-1111-1111-1111-111111111111' returning 1)
select tests.assert((select count(*) from u) = 1, 'user can update own profile');
rollback;

-- Column-level grants: id / created_at are immutable to clients
begin;
select tests.act_as('11111111-1111-1111-1111-111111111111');
do $$ begin
  begin
    update public.profiles set created_at = now() - interval '1 year' where id = auth.uid();
    raise exception 'ASSERTION FAILED: created_at should not be updatable';
  exception when insufficient_privilege then raise notice 'ok - created_at is not client-updatable';
  end;
  begin
    insert into public.profiles (id, username) values (gen_random_uuid(), 'sneaky');
    raise exception 'ASSERTION FAILED: client profile insert should fail';
  exception when insufficient_privilege then raise notice 'ok - clients cannot insert profiles directly';
  end;
end $$;
rollback;

-- 3. Decks -------------------------------------------------------------------------
begin;
select tests.act_as('11111111-1111-1111-1111-111111111111');
insert into public.decks (id, owner_id, name, visibility) values
  ('aaaaaaaa-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Private Deck', 'private'),
  ('aaaaaaaa-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'Public Deck', 'public'),
  ('aaaaaaaa-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'Unlisted Deck', 'unlisted');
insert into public.deck_cards (deck_id, card_id, quantity) values
  ('aaaaaaaa-0000-0000-0000-000000000002', 'DEV-001', 2),
  ('aaaaaaaa-0000-0000-0000-000000000003', 'DEV-002', 1);
commit;

begin;
select tests.act_as('22222222-2222-2222-2222-222222222222');
select tests.assert((select count(*) from public.decks) = 1, 'other user sees only public decks (not private/unlisted)');
select tests.assert((select count(*) from public.deck_cards) = 1, 'other user sees only public deck cards');
select tests.assert((select count(*) from public.get_shared_deck('aaaaaaaa-0000-0000-0000-000000000003')) = 1,
  'unlisted deck readable by id via get_shared_deck');
select tests.assert((select jsonb_array_length(cards) from public.get_shared_deck('aaaaaaaa-0000-0000-0000-000000000003')) = 1,
  'get_shared_deck returns the deck list');
select tests.assert((select count(*) from public.get_shared_deck('aaaaaaaa-0000-0000-0000-000000000001')) = 0,
  'private deck NOT readable via get_shared_deck');
select tests.assert((select owner_username from public.get_shared_deck('aaaaaaaa-0000-0000-0000-000000000003')) is null,
  'get_shared_deck hides username of a private profile');
do $$ begin
  begin
    insert into public.decks (owner_id, name) values ('11111111-1111-1111-1111-111111111111', 'Forged');
    raise exception 'ASSERTION FAILED: forged owner insert should fail';
  exception when insufficient_privilege then raise notice 'ok - cannot create a deck owned by someone else';
  end;
  begin
    insert into public.deck_cards (deck_id, card_id, quantity) values ('aaaaaaaa-0000-0000-0000-000000000002', 'DEV-003', 1);
    raise exception 'ASSERTION FAILED: writing into another user''s deck should fail';
  exception when insufficient_privilege then raise notice 'ok - cannot add cards to another user''s deck';
  end;
end $$;
with d as (delete from public.decks where id = 'aaaaaaaa-0000-0000-0000-000000000002' returning 1)
select tests.assert((select count(*) from d) = 0, 'cannot delete another user''s public deck');
rollback;

begin;
select tests.act_as('11111111-1111-1111-1111-111111111111');
do $$ begin
  begin
    update public.decks set owner_id = '22222222-2222-2222-2222-222222222222'
     where id = 'aaaaaaaa-0000-0000-0000-000000000001';
    raise exception 'ASSERTION FAILED: owner_id must not be client-updatable';
  exception when insufficient_privilege then raise notice 'ok - deck ownership cannot be transferred by clients';
  end;
end $$;
rollback;

begin;
select tests.act_as(null);
select tests.assert((select count(*) from public.decks) = 1, 'anon sees only public decks');
do $$ begin
  begin
    insert into public.decks (owner_id, name) values ('11111111-1111-1111-1111-111111111111', 'Anon');
    raise exception 'ASSERTION FAILED: anon deck insert should fail';
  exception when insufficient_privilege then raise notice 'ok - anon cannot create decks';
  end;
end $$;
rollback;

-- Deck rules enforced in the database
begin;
select tests.act_as('11111111-1111-1111-1111-111111111111');
do $$ begin
  begin
    insert into public.deck_cards (deck_id, card_id, quantity) values ('aaaaaaaa-0000-0000-0000-000000000001', 'DEV-005', 3);
    raise exception 'ASSERTION FAILED: quantity 3 should be rejected';
  exception when check_violation then raise notice 'ok - max 2 copies per card';
  end;
end $$;
rollback;

begin;
select tests.act_as('11111111-1111-1111-1111-111111111111');
insert into public.deck_cards (deck_id, card_id, quantity)
  select 'aaaaaaaa-0000-0000-0000-000000000001', 'DEV-' || lpad(n::text, 3, '0'), 2 from generate_series(1, 10) n;
select tests.assert((select sum(quantity) from public.deck_cards where deck_id = 'aaaaaaaa-0000-0000-0000-000000000001') = 20,
  'a 20-card deck is accepted');
do $$ begin
  begin
    insert into public.deck_cards (deck_id, card_id, quantity) values ('aaaaaaaa-0000-0000-0000-000000000001', 'DEV-011', 1);
    set constraints deck_cards_limit immediate;
    raise exception 'ASSERTION FAILED: 21st card should be rejected';
  exception when check_violation then raise notice 'ok - deck capped at 20 cards';
  end;
end $$;
rollback;

-- updated_at is bumped on the parent deck when contents change
do $$
declare before_ts timestamptz;
begin
  select updated_at into before_ts from public.decks where id = 'aaaaaaaa-0000-0000-0000-000000000002';
  perform pg_sleep(0.01);
  perform tests.act_as('11111111-1111-1111-1111-111111111111');
  insert into public.deck_cards (deck_id, card_id, quantity) values ('aaaaaaaa-0000-0000-0000-000000000002', 'DEV-004', 1);
  perform tests.assert((select updated_at from public.decks where id = 'aaaaaaaa-0000-0000-0000-000000000002') > before_ts,
    'editing deck contents bumps deck.updated_at (works under client grants)');
  raise exception using errcode = 'P0001', message = 'rollback-sentinel';
exception when sqlstate 'P0001' then
  if sqlerrm <> 'rollback-sentinel' then raise; end if;
end $$;

-- 4. Match records -------------------------------------------------------------------
begin;
select tests.act_as('11111111-1111-1111-1111-111111111111');
insert into public.match_records (owner_id, deck_id, result, mode, played_at)
  values ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-0000-0000-0000-000000000001', 'win', 'ranked', now());
commit;

begin;
select tests.act_as('22222222-2222-2222-2222-222222222222');
select tests.assert((select count(*) from public.match_records) = 0, 'match records are private to their owner');
insert into public.decks (id, owner_id, name) values ('bbbbbbbb-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'B deck');
do $$ begin
  begin
    insert into public.match_records (owner_id, deck_id, result, mode, played_at)
      values ('22222222-2222-2222-2222-222222222222', 'aaaaaaaa-0000-0000-0000-000000000002', 'loss', 'casual', now());
    raise exception 'ASSERTION FAILED: linking someone else''s (public) deck should fail';
  exception when insufficient_privilege then raise notice 'ok - matches can only link the owner''s decks';
  end;
end $$;
insert into public.match_records (owner_id, deck_id, result, mode, played_at)
  values ('22222222-2222-2222-2222-222222222222', 'bbbbbbbb-0000-0000-0000-000000000001', 'draw', 'casual', now());
select tests.assert((select count(*) from public.match_records) = 1, 'user can record matches with own deck');
rollback;

begin;
select tests.act_as(null);
do $$ begin
  begin
    perform 1 from public.match_records;
    raise exception 'ASSERTION FAILED: anon should have no access to match_records';
  exception when insufficient_privilege then raise notice 'ok - anon has no grant on match_records';
  end;
end $$;
rollback;

-- 5. Catalog is read-only to clients ------------------------------------------------
begin;
select tests.act_as(null);
select tests.assert((select count(*) from catalog.cards) = 15, 'anon can read the card catalog');
rollback;

begin;
select tests.act_as('11111111-1111-1111-1111-111111111111');
do $$ begin
  begin
    insert into catalog.cards (id, set_id, number, name, supertype) values ('DEV-999', 'DEV', '999', 'Injected', 'trainer');
    raise exception 'ASSERTION FAILED: client catalog insert should fail';
  exception when insufficient_privilege then raise notice 'ok - clients cannot write to catalog';
  end;
  begin
    update catalog.cards set name = 'Defaced';
    raise exception 'ASSERTION FAILED: client catalog update should fail';
  exception when insufficient_privilege then raise notice 'ok - clients cannot modify catalog';
  end;
end $$;
rollback;

-- 6. Ingest schema is service-role only ----------------------------------------------
begin;
select tests.act_as('11111111-1111-1111-1111-111111111111');
do $$ begin
  begin
    perform 1 from ingest.runs;
    raise exception 'ASSERTION FAILED: authenticated must not read ingest.runs';
  exception when insufficient_privilege then raise notice 'ok - ingest schema hidden from authenticated';
  end;
end $$;
rollback;

begin;
set local role service_role;
insert into ingest.runs (source_id, triggered_by) values ('00000000-0000-0000-0000-0000000000d5', 'manual');
do $$ begin
  begin
    insert into ingest.runs (source_id, triggered_by) values ('00000000-0000-0000-0000-0000000000d5', 'schedule');
    raise exception 'ASSERTION FAILED: second concurrent run should be rejected';
  exception when unique_violation then raise notice 'ok - one running ingestion per source';
  end;
end $$;
rollback;

-- 7. Storage: avatar uploads scoped to own folder ------------------------------------
begin;
select tests.act_as('11111111-1111-1111-1111-111111111111');
insert into storage.objects (bucket_id, name) values ('avatars', '11111111-1111-1111-1111-111111111111/me.png');
do $$ begin
  begin
    insert into storage.objects (bucket_id, name) values ('avatars', '22222222-2222-2222-2222-222222222222/evil.png');
    raise exception 'ASSERTION FAILED: uploading into another user''s folder should fail';
  exception when insufficient_privilege then raise notice 'ok - avatar uploads limited to own folder';
  end;
end $$;
rollback;

-- 8. Every table in public/catalog/ingest has RLS enabled ------------------------------
select tests.assert(not exists (
    select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace
     where c.relkind = 'r' and n.nspname in ('public', 'catalog', 'ingest') and not c.relrowsecurity),
  'RLS is enabled on every table in public, catalog, and ingest');

select tests.assert(not exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname in ('public') and p.prosecdef
       and not exists (select 1 from unnest(p.proconfig) cfg where cfg like 'search_path=%')),
  'every SECURITY DEFINER function pins search_path');

\echo '== RLS test suite: ALL PASSED'
