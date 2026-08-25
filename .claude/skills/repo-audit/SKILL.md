---
name: repo-audit
description: Scan the voetbalTrainingApp repo for violations of the project guidelines in docs/guidelines/* (TypeScript TS-*, frontend FE-*, backend BE-*, domain DOM-*). Use when asked to "audit", "check the rules", "find violations", "lint the conventions", or before finishing a change. Runs a static scanner then guides a manual review of the rules that can't be grepped.
license: MIT
metadata:
  author: voetbalTrainingApp
  version: "1.0.0"
---

# repo-audit — check the codebase against the project guidelines

Audits this repo against the rulebook in `docs/guidelines/`:
`typescript.md` (TS-*), `frontend.md` (FE-*), `backend.md` (BE-*), `domain.md` (DOM-*),
plus the golden rules in `CLAUDE.md`.

## How to run

1. **Run the static scanner** (no dependencies, fast):

   ```bash
   node .claude/skills/repo-audit/audit.mjs
   ```

   It prints findings grouped by severity (ERROR / WARN / INFO), each tagged with its rule id
   (e.g. `BE-1`) and `file:line`, then a summary. It **exits non-zero if any ERROR** is found,
   so it can gate a commit or CI step. Pass `--json` for machine-readable output.

2. **Read `docs/guidelines/*`** for any rule ids the scanner reports, so you explain each
   finding in the rule's own terms and propose the correct fix.

3. **Do the manual pass** below for rules the scanner can't check mechanically, focusing on
   files touched by the current change.

4. **Report**: list violations grouped by severity with `file:line`, the rule id, why it's a
   problem, and the fix. Don't auto-edit unless the user asked you to fix them — propose first.

## What the scanner checks (mechanical)

| Rule | Check |
|------|-------|
| TS-1 | `any` usage (`: any`, `as any`, `<any>`, `any[]`) outside `generated/` |
| TS-2 | `@ts-ignore` (use `@ts-expect-error <reason>`) |
| BE-1 / TS-7 | imports from `@prisma/client` (must be `../generated/prisma/client`) |
| BE-2 | `new PrismaClient(` outside `lib/prisma.ts` |
| BE-5 | `app/**/actions.ts` missing the `"use server"` directive |
| BE-15 | `console.*` in `app/`, `components/`, `lib/` (scripts excepted) |
| FE-1 | hooks/handlers (`useState`, `useEffect`, `onClick`, …) without `"use client"` |
| FE-6 | DB-backed `page.tsx` missing `export const dynamic = "force-dynamic"` |
| INFO | `TODO`/`FIXME` markers |

## Manual review (not grepped — judgement needed)

- **DOM-1..5 (diagrams):** coordinates in metres within footprint, `y=0` top, in-range; no
  overlapping figures; the diagram shows all players/equipment and matches the `steps` lettering.
  Cross-check any changed drill data and run `npm run seed` — `Overlap check: OK` must print.
- **DOM-6/7 (content):** Dutch, KNVB terms; concrete step-by-step instructions (no generic filler).
- **DOM-8 (sub-theme):** every drill's `subTheme` ∈ `SUB_THEMES[theme]`.
- **DOM-10..13 (generator):** correct block shape, split threshold, **rotation presented as one
  section** (not duplicated blocks), space/materials warnings present.
- **BE-6 (validation):** every server action parses `FormData` through a Zod schema before use.
- **FE-2/FE-9 (islands/forms):** `"use client"` pushed to leaves; forms post to server actions.
- **TS-4 (boundaries):** untrusted input validated once at the edge.
- After any fix, run `npm run build` (full typecheck) and `npm run lint`.

## Notes

- The scanner is intentionally conservative but can have false positives (e.g. `any` inside a
  comment). Confirm each finding against the source line before reporting it as a violation.
- Adding a rule? Add it to the relevant `docs/guidelines/*` file **and**, if mechanical, to the
  `RULES` array in `audit.mjs`.
