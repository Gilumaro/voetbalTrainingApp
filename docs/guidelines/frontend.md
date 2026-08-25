# Frontend guidelines — React / Next App Router / diagrams (FE-*)

Applies to `app/**` and `components/**`. This is **Next.js 16 (App Router + Turbopack) +
React 19**. Read `node_modules/next/dist/docs/` before using a framework API — signatures
differ from older Next. Severity: **error** / **warn** / **info**.

## Server vs client components

- **FE-1 (error) — Client components declare `"use client"` at the top.** Any file using
  `useState`, `useEffect`, `useRef`, event handlers (`onClick`/`onChange`), or browser APIs
  is a client component and must start with the `"use client"` directive. Files without it are
  Server Components by default.
- **FE-2 (warn) — Default to Server Components; push `"use client"` to the leaves.** Fetch
  data and read the DB in Server Components; make only the interactive bit a client island
  (e.g. `AnimatedPitchDiagram`, `DrillForm`, `PrintButton`). Don't make a whole page a client
  component to get one button.
- **FE-3 (warn) — Never import server-only modules into client components.** `lib/prisma`,
  data-access, and server actions must not be imported by a `"use client"` file. Pass data
  down as serializable props instead.
- **FE-4 (info) — Props must be serializable across the server→client boundary** (no
  functions except server actions, no class instances). Diagrams receive plain aid/action
  arrays.

## Routing, pages & data

- **FE-5 (error) — `params`/`searchParams` are async in Next 16.** `await` them
  (`const { id } = await params`). Type pages with the generated `PageProps<"/route">` helper,
  as existing pages do.
- **FE-6 (error) — DB-backed pages set `export const dynamic = "force-dynamic"`.** Every page
  that reads Prisma (library, detail, generator, trainingen) opts out of static caching so it
  reflects current data.
- **FE-7 (warn) — Mutations go through Server Actions**, not client fetch/route handlers.
  Actions live in `app/<area>/actions.ts`, take `FormData`, validate with Zod, and
  `revalidatePath`/`redirect` as needed. Bind ids with `action.bind(null, id)`.
- **FE-8 (warn) — Use `next/link` for internal navigation** and the `[text](path)` file-link
  convention in prose. Use `notFound()` for missing records.

## Forms

- **FE-9 (warn) — Forms post to a server action** via the `action` prop; prefer uncontrolled
  inputs with `name=` + `defaultValue=`, reading values server-side from `FormData`. Reserve
  client state (`useState`) for genuinely interactive UI (dependent dropdowns like
  Thema→Sub-thema in `DrillForm`, live diagram preview, ordered step editors).
- **FE-10 (warn) — Complex/JSON fields ride in hidden inputs** as JSON strings (`aids`,
  `actions`, `steps`), parsed by `parseDrillForm`. Keep that the single serialization path.

## Diagrams (SVG)

- **FE-11 (error) — Diagrams are generated from placement data, never hand-drawn pixels.**
  Coordinates are **metres within the drill footprint, `y=0` at the top**; the component scales
  metres→SVG units. See DOM-1..3 for the geometry invariants.
- **FE-12 (warn) — One action-list model powers static + animated diagrams.** `PitchDiagram`
  (static), `CombinedPitchDiagram` (two stations on one half-pitch, applies the
  `(x,y)→(y, fx−x)` rotation to both aids and actions), and `AnimatedPitchDiagram` (play button)
  all read the same `DrillAid` + `DrillAction` rows. Don't author a second source of truth.
- **FE-13 (warn) — Arrowheads are computed polygons, not SVG `marker` defs**, to avoid `id`
  collisions when several diagrams render on one page. Follow the existing `ACTION_STYLE` map
  (PASS solid, RUN dashed, DRIBBLE wavy, CARRY double, SHOT bold red).
- **FE-14 (warn) — The legend lists only symbols actually present** (`DiagramLegend`), and
  player labels render on top of equipment (`orderAids`).

## Styling & accessibility

- **FE-15 (warn) — Tailwind utility classes only** (v4); no ad-hoc inline `style` except
  computed SVG geometry. Reuse shared class consts (e.g. `inputCls`) rather than copy-pasting.
- **FE-16 (info) — Print view is first-class.** Field-ready output lives in
  `PrintSessionView`; use the `no-print` / `avoid-break` utilities so blocks don't split
  across pages. Verify changes in both screen and print paths.
- **FE-17 (info) — Responsive + Dutch.** Must work phone and laptop (NFR-2); all copy Dutch.
