-- 0300: user profiles and preferences.
-- A profile row is created automatically for every auth.users row.
-- Email lives only in auth.users and is never copied into public tables.

create table public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  username      extensions.citext not null unique
                  check (username ~ '^[A-Za-z0-9_]{3,24}$'),
  display_name  text check (display_name is null or char_length(display_name) between 1 and 40),
  bio           text check (bio is null or char_length(bio) <= 280),
  avatar_path   text check (avatar_path is null or avatar_path ~ '^[0-9a-f-]{36}/[A-Za-z0-9._-]{1,128}$'),
  visibility    text not null default 'private' check (visibility in ('private', 'public')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
comment on table public.profiles is 'One row per auth user. Private by default.';
comment on column public.profiles.avatar_path is 'Storage object path "<user_id>/<file>"; bucket policies scope writes to the owner folder.';

create index profiles_public_username_idx on public.profiles (username) where visibility = 'public';

create table public.user_preferences (
  user_id         uuid primary key references public.profiles (id) on delete cascade,
  theme           text not null default 'dark' check (theme in ('dark', 'light', 'system')),
  reduced_motion  boolean not null default false,
  locale          text not null default 'en' check (locale ~ '^[a-z]{2}(-[A-Z]{2})?$'),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger user_preferences_updated_at before update on public.user_preferences
  for each row execute function public.set_updated_at();

-- Profile initialisation -------------------------------------------------------
-- Uses the username requested at sign-up when it is valid and free; otherwise
-- falls back to a generated handle so sign-up never fails on a username clash.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested text := nullif(trim(new.raw_user_meta_data ->> 'username'), '');
  fallback  text := 'trainer_' || substr(replace(new.id::text, '-', ''), 1, 10);
begin
  -- Note: with search_path = '' a bare "=" on citext resolves to the
  -- case-sensitive text operator, so we rely on the unique index (which does
  -- use citext semantics) and catch the violation instead of pre-checking.
  -- This is also race-safe when two sign-ups request the same name.
  if requested is not null and requested ~ '^[A-Za-z0-9_]{3,24}$' then
    begin
      insert into public.profiles (id, username) values (new.id, requested);
    exception when unique_violation then
      insert into public.profiles (id, username) values (new.id, fallback);
    end;
  else
    insert into public.profiles (id, username) values (new.id, fallback);
  end if;

  insert into public.user_preferences (user_id) values (new.id);
  return new;
end;
$$;

comment on function public.handle_new_user() is 'Trigger on auth.users: creates profile + preferences rows.';

revoke all on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- RLS ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.user_preferences enable row level security;

create policy "profiles: read own or public" on public.profiles
  for select to anon, authenticated
  using (visibility = 'public' or id = (select auth.uid()));

create policy "profiles: update own" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));
-- No INSERT/DELETE policies: rows are created by trigger and removed by cascade.

create policy "preferences: read own" on public.user_preferences
  for select to authenticated using (user_id = (select auth.uid()));
create policy "preferences: update own" on public.user_preferences
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- Least privilege: anon may only read public profiles; authenticated may only
-- update the columns users are meant to change.
revoke all on public.profiles, public.user_preferences from anon, authenticated;
grant select on public.profiles to anon, authenticated;
grant update (username, display_name, bio, avatar_path, visibility) on public.profiles to authenticated;
grant select on public.user_preferences to authenticated;
grant update (theme, reduced_motion, locale) on public.user_preferences to authenticated;
grant all on public.profiles, public.user_preferences to service_role;
