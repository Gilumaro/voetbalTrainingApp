# TypeScript guidelines (TS-*)

Rules for all `.ts`/`.tsx` in this repo **except** `generated/` (generated Prisma client)
and `node_modules/`. Severity: **error** = must fix, **warn** = fix unless justified,
**info** = advisory. The `/repo-audit` skill flags the mechanically-checkable ones.

## Types & safety

- **TS-1 (error) — No `any`.** No `: any`, `as any`, `<any>`, or implicit `any`. Reach for a
  precise type, a union from `lib/enums.ts`, a generic, or `unknown` + narrowing. `unknown`
  is the correct type for genuinely unknown input (then validate/narrow, e.g. via Zod).
- **TS-2 (error) — No `@ts-ignore`.** If a suppression is truly unavoidable use
  `// @ts-expect-error <reason>` so it fails when the underlying error disappears.
- **TS-3 (warn) — Avoid non-null `!`.** Prefer a guard, early return, or `?? fallback`. A
  `!` is only acceptable when an invariant makes null impossible and a comment says why.
- **TS-4 (warn) — Validate at boundaries, trust within.** Untrusted input (FormData, params,
  JSON columns, env) is parsed/validated once at the edge (Zod in `lib/validation.ts`;
  `drillSteps()` for JSON columns), after which the typed value flows without re-checking.
- **TS-5 (info) — `satisfies` over casts.** Use `satisfies` to check object shape while
  keeping the literal's narrow type (e.g. Prisma select objects), instead of `as`.

## Imports & modules

- **TS-6 (warn) — `import type` for type-only imports.** Keeps type imports out of the
  runtime graph (matters for `"use client"`/server boundaries). e.g.
  `import type { Theme } from "@/lib/enums"`.
- **TS-7 (error) — Use the `@/*` path alias** for cross-directory imports (`@/lib/...`,
  `@/components/...`). Relative `../../` chains are only for siblings. **Exception:** the
  generated Prisma client is imported by relative path (`../generated/prisma/client`) as the
  Prisma 7 setup requires — see BE-1.
- **TS-8 (info) — No default exports for shared modules** in `lib/`; use named exports so
  symbols are greppable and renames are safe. React components keep their default export.

## Style & structure

- **TS-9 (warn) — Model states as string-literal unions, not booleans-soup or magic
  strings.** This app has no DB enums; the single source of truth for every union
  (`Theme`, `DrillType`, `AidType`, `ActionKind`, sub-themes…) is `lib/enums.ts`, each paired
  with a Zod validator and a Dutch label map. Never inline a literal like `"ATTACK"` where the
  union type exists.
- **TS-10 (warn) — Keep functions small and pure where possible.** Pure helpers (geometry,
  scoring, grouping like `groupBlocksForDisplay`) live in `lib/` and take/return plain data so
  they're unit-testable without a DB or DOM.
- **TS-11 (info) — Name by intent, match surrounding code.** `camelCase` values/functions,
  `PascalCase` types/components/React files, `SCREAMING_SNAKE` module consts (`SUB_THEMES`,
  `ACTION_KIND_LABELS`). Dutch domain nouns are fine in identifiers when they mirror the UI.
- **TS-12 (warn) — No dead code / unused exports.** ESLint (`eslint-config-next`) is the
  gate; `npm run lint` must be clean.

## Errors

- **TS-13 (warn) — Fail loud at the edge, degrade gracefully in the UI.** Throw/return typed
  errors from actions; render a Dutch fallback (empty state, warning banner) rather than
  crashing a page. `try/catch` around `JSON.parse` of DB columns (see `drillSteps`).
