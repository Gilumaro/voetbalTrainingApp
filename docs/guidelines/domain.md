# Domain guidelines — KNVB methodology & app invariants (DOM-*)

The rules that make this a *correct soccer training planner*, not just a working web app.
Break one of these and the output is wrong even if the code compiles. Severity:
**error** = produces incorrect training/diagrams, **warn**, **info**.

## Diagram geometry & placement

- **DOM-1 (error) — Coordinate model.** Positions are **metres within a drill's footprint**
  (`footprintX` × `footprintY`), origin top-left, **`y = 0` at the top**, `y` increasing
  downward. Every `DrillAid` and `DrillAction` from/to point is in this space and must lie
  within `[0, footprint]`. Diagram components scale metres→SVG; never author pixels.
- **DOM-2 (error) — No figures overlap (lines excepted).** Players, cones, discs, balls, goals
  must not sit on top of each other. Approx radii for overlap math: player ≈ 0.93 m,
  cone/disc/ball ≈ 0.57 m. Goals are exempt from the check. Fix overlaps at the source
  coordinates when you can.
- **DOM-3 (warn) — `declutter()` is a safety net, not a substitute for good coordinates.**
  Seeding nudges lower-priority figures (balls/cones move before players; players stay put so
  arrows stay aligned) and clamps into `[0.3, footprint−0.3]`. `checkOverlaps()` must report
  `Overlap check: OK` after `npm run seed`. If it flags pairs, adjust the drill data.
- **DOM-4 (warn) — Show the whole drill.** Diagrams display **all** players and equipment for
  the drill's ideal player count, labelled (players A/B/C…; `PLAYER` blue, `PLAYER_OPP` orange),
  with pass/run/dribble/shot arrows and a legend — comparable to the KNVB "Rinus" references.
  Waiting players belong in the diagram (e.g. queued at point A), not omitted.
- **DOM-5 (warn) — Steps and diagram are consistent.** The A→B→C→D sequence named in `steps`
  must be visible and correctly lettered in the diagram; arrow `order` matches step order and
  drives the animation.

## Content & language

- **DOM-6 (error) — Dutch, KNVB terminology.** All content is Dutch: *leerdoel, thema/sub-thema,
  opbouw, partijvorm, opstelling, spelregels, warming-up, omschakelen*, etc. No English in the UI.
- **DOM-7 (error) — Instructions are concrete, coach-readable, step-by-step.** No generic
  filler ("running, jumping"). Each drill carries `setup` (Opstelling), ordered `steps`
  (Stappen), `rules` (Spelregels), plus coaching points and progressions/simplifications, so the
  coach can tell the kids exactly what to do.
- **DOM-8 (warn) — Every drill has a valid `theme` and `subTheme`.** `subTheme` (KNVB leerdoel)
  must be a member of `SUB_THEMES[theme]` in `lib/enums.ts`. The four sets (Aanvallen,
  Verdedigen, Omschakelen, and the Neutraal 6-set) are the source of truth; validate with
  `zSubTheme`.
- **DOM-9 (info) — Original content only.** Author drills in our own words grounded in the KNVB
  method; **no scraping/copying** Rinus/KNVB text, images, or diagrams (§3.1 of the plan).

## Session generation (`lib/generator.ts`)

- **DOM-10 (error) — Standard U15 session shape.** 75-min juniors default =
  **warming-up (whole group) → parallel → parallel → partijvorm (whole group)**; build simple →
  complex and always end in a match form. Block durations sum (with buffers) to the requested
  length.
- **DOM-11 (error) — Large squads split into two parallel stations that share the theme.**
  Above `SPLIT_THRESHOLD` (10) players, split into two groups (~8) on the same half-pitch; both
  stations carry the session theme.
- **DOM-12 (error) — Rotation, not repetition.** The two split blocks reuse the **same two
  stations** (set up once); the groups **rotate** (A: station1→station2, B: station2→station1)
  so everyone does both drills. This is intentional — the UI must present it as one rotation
  (`groupBlocksForDisplay` + `rotationSchedule` → the "Parallelle stations · groepen wisselen"
  card), never as two duplicated blocks. Distinct-drills-per-block is a deliberate product
  choice, not a default; don't "fix" the rotation by making drills distinct without the coach
  asking.
- **DOM-13 (error) — Respect space & materials.** Stations must physically fit their half-pitch
  (footprint check, 90° rotation allowed) and stay within the inventory in `Settings`; surface
  Dutch **warnings** rather than silently overscheduling goals/balls.
- **DOM-14 (warn) — Variety across weeks.** Deprioritise drills used in recent sessions
  (`recentDrillIds`); prefer fresh material.
- **DOM-15 (info) — Generate-then-refine.** Generation produces a draft the coach edits
  (reorder / swap / re-roll / re-time / nudge) before saving; never treat generated output as
  final.

## Deployment

- **DOM-16 (info) — Self-hosted Docker on the LAN.** Runs via docker-compose with a
  volume-backed SQLite file; no external SaaS at runtime. A **new migration or seed change**
  needs `docker compose down -v` + `docker compose up -d --build` to reseed the volume; a
  pure code/UI change only needs `up -d --build` (no `-v`).
