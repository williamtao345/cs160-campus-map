# Data files

These JSON files are the source of truth read by `scripts/seed-database.mjs`, which seeds them into
Firebase (`buildings` and `amenitiesByBuilding`). The app itself never reads these files directly — it
reads from Firebase via `loadBuildings` / `loadAmenitiesForBuilding` in `amenities.ts`.

- `buildings.json` — 242 buildings (177 original + 65 added from a UC Berkeley ArcGIS building layer
  that weren't previously tracked). New buildings from that merge got sequential ids starting at 272.
- `campus-building-polygons.json` — static map footprints, keyed independently of `buildings.json`
  (not affected by building additions/removals here).
- `restrooms.json` — per-building restroom records (unchanged, original cs160 source).
- `vending-machines.json`, `study-spaces.json` — unchanged; no better source than the app's own
  original (sparse) data has been found for these two categories.
- `water-refill-stations.json` — regenerated from a merge with the Berkeley Food Institute's 2021
  Foodscape Map (126 records, up from 1).
- `lactation-rooms.json`, `microwaves.json`, `zero-waste-stations.json`, `eateries.json`,
  `campus-gardens.json`, `basic-needs-services.json` — new categories, all from the same Foodscape
  Map merge.
- `changing-tables.json`, `menstrual-products.json` — new categories derived from free-text notes in
  an older UC Berkeley ArcGIS restroom-mapping scrape (one record per building where the source noted
  a changing table or menstrual product dispenser).

## `unmatched-amenities.json` — needs manual review

37 items from the same merge (mostly off-campus locations, student co-op gardens, and outdoor
waypoints like gates/plazas — see the file's own `_note` field for the full explanation) couldn't be
confidently attached to a building, so they are **not** included in any of the category files above and
**not** referenced by `scripts/seed-database.mjs`'s `amenitySources` list. They have zero effect on the
running app.

This file exists so the held-out items aren't silently lost. Before they can show up anywhere, someone
needs to manually review each item, decide which building (if any) it actually belongs to, and move it
into the matching category file above with a real `buildingId`.
