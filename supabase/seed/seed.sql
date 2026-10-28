-- LOCAL DEVELOPMENT SEED ONLY.
--
-- Contains clearly synthetic placeholder data so the UI has something to
-- render locally. It is NOT real card data, NOT real tournament results, and
-- must never be applied to staging or production. Real catalog data arrives
-- via the ingestion pipeline (Phase 1) from a source whose terms have been
-- reviewed (see docs/MIGRATION_STRATEGY.md).

insert into catalog.data_sources (id, slug, name, kind, is_active, notes)
values ('00000000-0000-0000-0000-0000000000d5', 'dev-fixture', 'Development fixture (synthetic)', 'manual', true,
        'Synthetic placeholder rows for local development only.')
on conflict (id) do nothing;

insert into catalog.card_sets (id, name, series, source_id)
values ('DEV', 'Development Sample Set', 'Synthetic', '00000000-0000-0000-0000-0000000000d5')
on conflict (id) do nothing;

insert into catalog.cards (id, set_id, number, name, supertype, subtype, energy_type, hp, source_id)
select 'DEV-' || lpad(n::text, 3, '0'), 'DEV', n::text, 'Sample Card ' || n,
       case when n % 5 = 0 then 'trainer' else 'pokemon' end,
       case when n % 5 = 0 then 'item' else 'basic' end,
       case when n % 5 = 0 then null else (array['grass','fire','water','lightning','psychic'])[1 + n % 5] end,
       case when n % 5 = 0 then null else 60 + (n % 4) * 10 end,
       '00000000-0000-0000-0000-0000000000d5'
from generate_series(1, 30) as n
on conflict (id) do nothing;
