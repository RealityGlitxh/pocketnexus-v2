-- 0400: user-owned decks, deck contents, and match records.

create table public.decks (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null references public.profiles (id) on delete cascade,
  name          text not null check (char_length(trim(name)) between 1 and 60),
  description   text check (description is null or char_length(description) <= 500),
  visibility    text not null default 'private' check (visibility in ('private', 'unlisted', 'public')),
  archetype_id  uuid references catalog.archetypes (id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index decks_owner_updated_idx on public.decks (owner_id, updated_at desc);
create index decks_public_idx on public.decks (updated_at desc) where visibility = 'public';
create index decks_archetype_idx on public.decks (archetype_id) where archetype_id is not null;

create table public.deck_cards (
  deck_id     uuid not null references public.decks (id) on delete cascade,
  card_id     text not null references catalog.cards (id) on delete restrict,
  quantity    smallint not null check (quantity between 1 and 2),
  created_at  timestamptz not null default now(),
  primary key (deck_id, card_id)
);
create index deck_cards_card_idx on public.deck_cards (card_id);

-- Pocket decks hold at most 20 cards. Drafts may be incomplete, so this only
-- caps the total; "exactly 20" is enforced when a deck is marked complete
-- (Phase 1) and by the client validator.
create or replace function public.enforce_deck_card_limit()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  total integer;
begin
  -- Serialise concurrent edits to the same deck.
  perform 1 from public.decks d where d.id = new.deck_id for update;
  select coalesce(sum(dc.quantity), 0) into total
    from public.deck_cards dc where dc.deck_id = new.deck_id;
  if total > 20 then
    raise exception 'A deck may contain at most 20 cards (would have %).', total
      using errcode = 'check_violation';
  end if;
  return null;
end;
$$;

create constraint trigger deck_cards_limit
  after insert or update on public.deck_cards
  deferrable initially deferred
  for each row execute function public.enforce_deck_card_limit();

create table public.match_records (
  id                     uuid primary key default gen_random_uuid(),
  owner_id               uuid not null references public.profiles (id) on delete cascade,
  deck_id                uuid references public.decks (id) on delete set null,
  opponent_archetype_id  uuid references catalog.archetypes (id) on delete set null,
  result                 text not null check (result in ('win', 'loss', 'draw')),
  mode                   text not null check (mode in ('ranked', 'casual', 'event', 'practice')),
  went_first             boolean,
  notes                  text check (notes is null or char_length(notes) <= 1000),
  played_at              timestamptz not null,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);
create index match_records_owner_played_idx on public.match_records (owner_id, played_at desc);
create index match_records_deck_idx on public.match_records (deck_id) where deck_id is not null;

create trigger decks_updated_at before update on public.decks
  for each row execute function public.set_updated_at();
create trigger match_records_updated_at before update on public.match_records
  for each row execute function public.set_updated_at();

-- Touch the parent deck when its contents change so "recently edited" sorts work.
-- SECURITY DEFINER because clients have no UPDATE grant on decks.updated_at.
-- Safe: it only touches the deck of a deck_cards row the caller was already
-- allowed (by RLS) to write.
create or replace function public.touch_parent_deck()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.decks set updated_at = now()
   where id = coalesce(new.deck_id, old.deck_id);
  return null;
end;
$$;

create trigger deck_cards_touch_deck
  after insert or update or delete on public.deck_cards
  for each row execute function public.touch_parent_deck();

-- RLS ---------------------------------------------------------------------------
alter table public.decks enable row level security;
alter table public.deck_cards enable row level security;
alter table public.match_records enable row level security;

-- Decks: owners have full access; anyone may read PUBLIC decks.
-- "unlisted" decks are NOT selectable by non-owners (that would allow
-- enumeration); they are served only by get_shared_deck(id) below.
create policy "decks: read own or public" on public.decks
  for select to anon, authenticated
  using (visibility = 'public' or owner_id = (select auth.uid()));
create policy "decks: insert own" on public.decks
  for insert to authenticated with check (owner_id = (select auth.uid()));
create policy "decks: update own" on public.decks
  for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));
create policy "decks: delete own" on public.decks
  for delete to authenticated using (owner_id = (select auth.uid()));

-- Deck cards inherit access from their deck.
create policy "deck_cards: read if deck readable" on public.deck_cards
  for select to anon, authenticated
  using (exists (
    select 1 from public.decks d
     where d.id = deck_id
       and (d.visibility = 'public' or d.owner_id = (select auth.uid()))
  ));
create policy "deck_cards: write own deck" on public.deck_cards
  for all to authenticated
  using (exists (select 1 from public.decks d where d.id = deck_id and d.owner_id = (select auth.uid())))
  with check (exists (select 1 from public.decks d where d.id = deck_id and d.owner_id = (select auth.uid())));

-- Match records are strictly private. A linked deck must belong to the same user.
create policy "matches: read own" on public.match_records
  for select to authenticated using (owner_id = (select auth.uid()));
create policy "matches: insert own" on public.match_records
  for insert to authenticated
  with check (
    owner_id = (select auth.uid())
    and (deck_id is null or exists (
      select 1 from public.decks d where d.id = deck_id and d.owner_id = (select auth.uid())))
  );
create policy "matches: update own" on public.match_records
  for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (
    owner_id = (select auth.uid())
    and (deck_id is null or exists (
      select 1 from public.decks d where d.id = deck_id and d.owner_id = (select auth.uid())))
  );
create policy "matches: delete own" on public.match_records
  for delete to authenticated using (owner_id = (select auth.uid()));

-- Grants ------------------------------------------------------------------------
revoke all on public.decks, public.deck_cards, public.match_records from anon, authenticated;
grant select on public.decks, public.deck_cards to anon;
grant select, insert, delete on public.decks, public.deck_cards, public.match_records to authenticated;
grant update (name, description, visibility, archetype_id) on public.decks to authenticated;
grant update (quantity) on public.deck_cards to authenticated;
grant update (deck_id, opponent_archetype_id, result, mode, went_first, notes, played_at)
  on public.match_records to authenticated;
grant all on public.decks, public.deck_cards, public.match_records to service_role;

-- Shared-deck read path --------------------------------------------------------
-- Returns a public or unlisted deck by id (knowing the UUID is the capability).
-- Never returns private decks to non-owners.
create or replace function public.get_shared_deck(p_deck_id uuid)
returns table (
  id uuid, name text, description text, visibility text,
  archetype_id uuid, owner_username text, updated_at timestamptz, cards jsonb
)
language sql
stable
security definer
set search_path = ''
as $$
  select d.id, d.name, d.description, d.visibility, d.archetype_id,
         case when p.visibility = 'public' then p.username::text end as owner_username,
         d.updated_at,
         coalesce(
           (select jsonb_agg(jsonb_build_object('card_id', dc.card_id, 'quantity', dc.quantity)
                             order by dc.card_id)
              from public.deck_cards dc where dc.deck_id = d.id),
           '[]'::jsonb)
    from public.decks d
    join public.profiles p on p.id = d.owner_id
   where d.id = p_deck_id
     and (d.visibility in ('public', 'unlisted') or d.owner_id = (select auth.uid()));
$$;

revoke all on function public.get_shared_deck(uuid) from public;
grant execute on function public.get_shared_deck(uuid) to anon, authenticated;

-- Internal trigger functions are not callable through the API.
revoke all on function public.enforce_deck_card_limit() from public, anon, authenticated;
revoke all on function public.touch_parent_deck() from public, anon, authenticated;
revoke all on function public.set_updated_at() from public, anon, authenticated;
