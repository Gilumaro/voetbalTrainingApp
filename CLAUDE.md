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
