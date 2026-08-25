# Backend guidelines — Prisma 7, server actions, validation, data access (BE-*)

Applies to `lib/**`, `app/**/actions.ts`, `prisma/**`, and `scripts/**`. Severity:
**error** / **warn** / **info**.

## Prisma 7 (the `prisma-client` generator + driver adapter)

- **BE-1 (error) — Import the generated client, not the package.** Use
  `import { PrismaClient } from "../generated/prisma/client"`. **Never** import from
  `@prisma/client` (Prisma 7 with the `prisma-client` generator emits to `generated/prisma`).
  `Prisma` namespace types come from the same generated path.
- **BE-2 (error) — One client, via the singleton.** Import `{ prisma }` from `@/lib/prisma`.
  Only `lib/prisma.ts` may call `new PrismaClient(...)`, and it does so through the
  `@prisma/adapter-better-sqlite3` adapter (SQLite in Prisma 7 requires a driver adapter) with
  an HMR-safe global. No other file constructs a client.
- **BE-3 (error) — Schema change → migrate → generate → build.** After editing
  `schema.prisma`: `npx prisma migrate dev --name <change>` (auto-generates in v7) and, if
  types still look stale, `npx prisma generate`, then `npm run build`. Stale generated types
  are the top cause of "property does not exist" phantom errors here.
- **BE-4 (info) — `DATABASE_URL` drives the DB location.** Defaults to `file:./dev.db`
  (project-root cwd); Docker overrides it to the mounted volume (`file:/data/app.db`). Don't
  hardcode paths. Migrations run at container start via `docker-entrypoint.sh`.

## Server actions

- **BE-5 (error) — Server-action files start with `"use server"`.** All of
  `app/**/actions.ts`. Actions are the only mutation entry point (see FE-7).
- **BE-6 (error) — Validate every input with Zod before use.** Parse `FormData` through a
  schema from `lib/validation.ts` (`parseDrillForm` handles the `aids`/`actions`/`steps` JSON
  and optional-field coercion). Never pass raw `FormData` values to Prisma.
- **BE-7 (warn) — Revalidate and redirect after writes.** Call `revalidatePath` for affected
  routes (and `redirect` where the flow moves on) so Server Components re-render fresh data.
- **BE-8 (warn) — Keep actions thin.** An action = validate → call a `lib/` function → revalidate.
  Business logic (generation, materials tally, geometry) lives in `lib/`, not in the action body.

## Data-access layer (`lib/`)

- **BE-9 (warn) — All DB access goes through `lib/` modules** (`drills.ts`, `sessions.ts`,
  `settings.ts`, `generator.ts`), not ad-hoc `prisma.*` calls scattered in components/pages.
  Pages call these typed helpers.
- **BE-10 (warn) — Include relations consistently.** When a helper returns a drill it includes
  `aids` and `actions` (ordered by `order`); reuse `getDrill`/`getDrills` and the
  `DrillWithAids` type rather than re-querying with a different shape, so diagrams always have
  their data.
- **BE-11 (warn) — Store list/tree data as JSON columns deliberately, parse defensively.**
  SQLite has no arrays; `steps` is a JSON string array read back via `drillSteps()` (wrapped in
  `try/catch`). Keep serialization in one place per field.
- **BE-12 (info) — Determinism where it matters.** The generator uses seeded RNG
  (`lib/rng.ts` `mulberry32`) so a session is reproducible from its `seed`; don't introduce
  `Math.random()` into generation paths.

## Seed & scripts

- **BE-13 (warn) — `scripts/` are `tsx` node scripts, not app code.** `console.log` is fine
  here (it's the report channel); app/lib/components code must not log to console (BE-15).
- **BE-14 (error) — Seeding preserves invariants.** `npm run seed` wipes and reseeds; it runs
  `declutter()` on aid positions and a `checkOverlaps()` pass that must print
  `Overlap check: OK`. If you add/edit drills, keep that green (see DOM-2/3).
- **BE-15 (warn) — No `console.log` in `app/`, `components/`, or `lib/`.** Surface problems to
  the user (Dutch warning banners, `warnings[]` from the generator) or throw; scripts excepted.

## General

- **BE-16 (info) — No secrets in the repo; config via env.** It's a LAN, single-user app
  (minimal/no auth by design), but still read runtime config from env, not literals.
- **BE-17 (info) — Backups = copy one file.** The whole DB is the SQLite file on the volume;
  don't add stateful stores that break the "copy one file to back up" property (NFR-5).
