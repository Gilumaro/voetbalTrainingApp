@AGENTS.md

# voetbalTrainingApp — working guide

> This file is loaded into context every session. Keep it lean. Detailed, per-domain
> rules live in `docs/guidelines/*` and are referenced from here; read them when you
> touch that area. Run the `/repo-audit` skill to check the codebase against these rules.

## What this is

A Dutch, self-hosted (Docker on Ubuntu/Proxmox) youth-soccer training planner. The coach
gives a few inputs (age category, theme, duration, player count, space) and the app
**auto-generates** a complete KNVB-style U15 session (warm-up → parallel stations → match
form), which can then be refined, saved, and printed field-side. See `docs/guidelines/domain.md`
for the methodology and invariants, and the plan at
`~/.claude/plans/i-am-a-soccer-snug-muffin.md` for the full requirements/decisions log.

## Tech stack

- **Next.js 16** (App Router + Turbopack), **React 19**, **TypeScript 5**, Server Actions.
- **Prisma 7** with the `prisma-client` generator (`generated/prisma`) + `@prisma/adapter-better-sqlite3`.
- **SQLite** (file DB; no enums → string unions validated with **Zod**).
- **Tailwind CSS v4**; inline **SVG** for all pitch diagrams; Dutch UI throughout.

## Repo map

- `app/` — App Router pages + `actions.ts` server-action files (`bibliotheek`, `genereren`, `trainingen`, `instellingen`).
- `components/` — React components; the diagram family: `PitchDiagram`, `CombinedPitchDiagram`, `AnimatedPitchDiagram`, `DiagramLegend`, `DrillForm`, `SessionDraftView`, `PrintSessionView`.
- `lib/` — non-UI logic: `prisma.ts` (client singleton), `enums.ts` (string unions + Zod), `validation.ts` (form schemas), `drills.ts`/`sessions.ts`/`settings.ts` (data access), `generator.ts` (session engine), `materials.ts`, `rng.ts`, `seed-data.ts`.
- `prisma/` — `schema.prisma` + `migrations/`. `scripts/` — `seed.ts` + `test-*.ts` harnesses.
- `generated/prisma/` — generated client (git-ignored; regenerate, never edit).
- `docs/guidelines/` — the detailed rulebook. `.claude/skills/repo-audit/` — the rule scanner.

## Everyday commands

```bash
npm run dev                       # next dev (Turbopack)
npm run build                     # prod build + full typecheck (run before declaring done)
npm run seed                      # tsx scripts/seed.ts — wipes + reseeds drills, runs overlap check
npx prisma migrate dev --name x   # create+apply a migration (auto-generates client in v7)
npx prisma generate               # regenerate client after a schema change if types look stale
```

## After a change — always tell me the deploy command

The app is self-hosted with Docker + a **volume-backed SQLite** file (`training-data` →
`/data/app.db`), which is **separate** from the local dev DB (`file:./dev.db`). So a change
that works in `npm run dev` does **not** automatically reach the running container.

**The remote server is updated by hand, every time — nothing auto-deploys.** The server no
longer builds the image itself: `docker-compose.yml` pulls a prebuilt image from Docker Hub
(`image: ivovandenberk/voetballapp:latest`), built and pushed from this dev machine. Every
deploy is:

1. **From this dev machine:** commit + push the code change (I don't push unless asked —
   remind the coach it's a prerequisite), then build and push the image:
   `docker build -t ivovandenberk/voetballapp:latest .` followed by
   `docker push ivovandenberk/voetballapp:latest`. Docker Desktop must be running locally.
2. **On the server (SSH session):** `cd` to the repo (`git pull` only needed if
   `docker-compose.yml` itself changed), then run the matching command from the **Remote
   server** column below.

> **Service name on the server is `voetbalapp`, not `app`.** The committed
> `docker-compose.yml` names the service `app`, but the coach's server compose renames it,
> so `docker compose exec`/`run`/`pull` on the server target **`voetbalapp`** (e.g.
> `sudo docker compose exec voetbalapp npm run import-drills`). Commands also need `sudo`
> there. The table below uses `app`; substitute `voetbalapp` for the real server. If the
> `ivovandenberk/voetballapp` Docker Hub repo is private, the server needs a one-time
> `docker login` before its first `pull`.

**At the end of any change, state which of these the coach must run (or "no deploy step
needed"). Never leave it implied.** Pick by what changed:

| What changed | Local dev | Remote server (after `ssh`) |
| --- | --- | --- |
| Code / UI only (no DB) | hot reload, nothing | `docker compose pull && docker compose up -d` |
| `schema.prisma` (new migration) | `npx prisma migrate dev` + `npx prisma generate` | `docker compose pull && docker compose up -d` (entrypoint runs `migrate deploy`); **no `-v`** |
| `SEED_DRILLS` / `scripts/seed.ts` (seed content) | `npm run seed` (wipes+reseeds dev) | `docker compose down -v && docker compose pull && docker compose up -d` — **`-v` wipes the volume**; confirm first [DOM-16] |
| Additive drill data (`lib/imported-drills.ts`) | `npm run import-drills` | `docker compose pull && docker compose up -d` **then** `docker compose exec app npm run import-drills` |

Notes: `-v` **destroys** the volume DB (all coach-created data) — only for a deliberate
reseed, and confirm before suggesting it. A plain `pull && up -d` fetches the new image but
leaves the volume (and its data) intact; it will **not** insert new rows on its own — data
changes need the matching `seed`/`import-drills` step run against the target DB. Pushing the
image only moves code, never the volume DB, so drill/seed steps still run separately. Tag
each build with something more traceable than `latest` (date or git short SHA) when you want
to be able to roll the server back to a specific build later.

## Non-negotiables (the short list — details in docs/guidelines)

1. **Read the Next.js docs first.** This is Next 16; APIs differ from memory. Consult
   `node_modules/next/dist/docs/` before writing framework code (see `AGENTS.md`).
2. **Prisma 7 client.** Import `PrismaClient` from `../generated/prisma/client`, **never**
   from `@prisma/client`. Use the shared `prisma` singleton in `lib/prisma.ts`; never
   `new PrismaClient()` elsewhere. [BE-1, BE-2]
3. **After any `schema.prisma` change**, run a migration **and** `npx prisma generate`, then
   `npm run build` — stale client types are the #1 source of phantom TS errors. [BE-3]
4. **Validate every server-action input with Zod** (`lib/validation.ts`); parse `FormData`,
   don't trust it. Server-action files start with `"use server"`. [BE-4, BE-5]
5. **Pages that hit the DB set `export const dynamic = "force-dynamic"`.** [FE-6]
6. **Client components declare `"use client"`** and stay leaf/island-sized; keep data
   fetching in Server Components. [FE-1]
7. **No `any`, no `@ts-ignore`.** Prefer precise types, `type` unions from `lib/enums.ts`,
   and `satisfies`. Use `import type` for type-only imports. [TS-1, TS-2]
8. **Dutch UI, KNVB terminology.** All user-facing strings are Dutch. [DOM-6]
9. **Diagrams are data-driven.** Coordinates are metres within a drill footprint, `y=0`
   at the top; don't hardcode pixels. Respect the overlap/declutter invariants. [DOM-1..3]
10. **Confirm before destructive/outward actions** and don't commit/push unless asked. The
    `AGENTS.md` agent-files block belongs in commits — don't strip it.

## Detailed guidelines

- `docs/guidelines/typescript.md` — TypeScript rules (TS-*)
- `docs/guidelines/frontend.md` — React / Next App Router / diagrams (FE-*)
- `docs/guidelines/backend.md` — Prisma 7, server actions, Zod, data access (BE-*)
- `docs/guidelines/domain.md` — KNVB methodology + app-specific invariants (DOM-*)
