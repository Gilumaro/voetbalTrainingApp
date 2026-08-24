import Link from "next/link";
import { getDrills } from "@/lib/drills";
import PitchDiagram from "@/components/PitchDiagram";
import {
  DRILL_TYPES,
  DRILL_TYPE_LABELS,
  THEMES,
  THEME_LABELS,
  type DrillType,
  type Theme,
} from "@/lib/enums";

export const dynamic = "force-dynamic";

export default async function BibliotheekPage({
  searchParams,
}: PageProps<"/bibliotheek">) {
  const sp = await searchParams;
  const type = (sp.type as DrillType) || undefined;
  const theme = (sp.theme as Theme) || undefined;
  const drills = await getDrills({ type, theme });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Oefeningenbibliotheek</h1>
          <p className="mt-1 text-zinc-600">{drills.length} oefeningen</p>
        </div>
        <Link href="/bibliotheek/nieuw"
          className="rounded-lg bg-emerald-600 px-4 py-2.5 font-semibold text-white hover:bg-emerald-700">
          + Nieuwe oefening
        </Link>
      </div>

      <form className="flex flex-wrap items-end gap-3 rounded-xl border border-zinc-200 bg-white p-4">
        <label className="text-sm">
          <span className="block font-medium text-zinc-700">Type</span>
          <select name="type" defaultValue={type ?? ""} className="mt-1 rounded-lg border border-zinc-300 px-3 py-2">
            <option value="">Alle</option>
            {DRILL_TYPES.map((t) => (
              <option key={t} value={t}>{DRILL_TYPE_LABELS[t]}</option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="block font-medium text-zinc-700">Thema</span>
          <select name="theme" defaultValue={theme ?? ""} className="mt-1 rounded-lg border border-zinc-300 px-3 py-2">
            <option value="">Alle</option>
            {THEMES.map((t) => (
              <option key={t} value={t}>{THEME_LABELS[t]}</option>
            ))}
          </select>
        </label>
        <button type="submit" className="rounded-lg bg-zinc-800 px-4 py-2 font-medium text-white hover:bg-zinc-700">
          Filter
        </button>
        {(type || theme) && (
          <Link href="/bibliotheek" className="px-2 py-2 text-sm text-zinc-500 hover:text-zinc-800">
            Wissen
          </Link>
        )}
      </form>

      {drills.length === 0 ? (
        <p className="rounded-xl border border-dashed border-zinc-300 bg-white p-8 text-center text-zinc-500">
          Geen oefeningen gevonden.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {drills.map((d) => (
            <Link key={d.id} href={`/bibliotheek/${d.id}`}
              className="flex flex-col rounded-xl border border-zinc-200 bg-white p-4 transition hover:border-emerald-300 hover:shadow">
              <div className="grid h-32 place-items-center overflow-hidden rounded-lg bg-zinc-50">
                <PitchDiagram footprintX={d.footprintX} footprintY={d.footprintY} aids={d.aids} scale={4} className="max-h-32" />
              </div>
              <h2 className="mt-3 font-semibold text-zinc-900">{d.title}</h2>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <Badge>{DRILL_TYPE_LABELS[d.type as DrillType]}</Badge>
                <Badge tone="theme">{THEME_LABELS[d.theme as Theme]}</Badge>
              </div>
              <p className="mt-2 text-xs text-zinc-500">
                {d.minPlayers}–{d.maxPlayers} spelers · {d.durationMin} min · {d.footprintX}×{d.footprintY} m
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function Badge({ children, tone }: { children: React.ReactNode; tone?: "theme" }) {
  return (
    <span className={
      "rounded-full px-2 py-0.5 text-xs font-medium " +
      (tone === "theme"
        ? "bg-sky-50 text-sky-700"
        : "bg-emerald-50 text-emerald-700")
    }>
      {children}
    </span>
  );
}
