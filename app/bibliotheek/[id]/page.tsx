import Link from "next/link";
import { notFound } from "next/navigation";
import { getDrill, drillSteps } from "@/lib/drills";
import AnimatedPitchDiagram from "@/components/AnimatedPitchDiagram";
import DiagramLegend from "@/components/DiagramLegend";
import MaterialsList from "@/components/MaterialsList";
import { stationTally } from "@/lib/materials";
import { deleteDrill } from "../actions";
import {
  DRILL_TYPE_LABELS,
  THEME_LABELS,
  FIELD_TYPE_LABELS,
  AGE_GOAL,
  type DrillType,
  type Theme,
  type FieldType,
} from "@/lib/enums";

export const dynamic = "force-dynamic";

export default async function DrillDetailPage({ params }: PageProps<"/bibliotheek/[id]">) {
  const { id } = await params;
  const drill = await getDrill(Number(id));
  if (!drill) notFound();

  const del = deleteDrill.bind(null, drill.id);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/bibliotheek" className="text-sm text-zinc-500 hover:text-zinc-800">
            ← Terug naar bibliotheek
          </Link>
          <h1 className="mt-1 text-2xl font-semibold text-zinc-900">{drill.title}</h1>
          <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-medium text-emerald-700">
              {DRILL_TYPE_LABELS[drill.type as DrillType]}
            </span>
            <span className="rounded-full bg-sky-50 px-2 py-0.5 font-medium text-sky-700">
              {THEME_LABELS[drill.theme as Theme]}
            </span>
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 font-medium text-zinc-600">
              {FIELD_TYPE_LABELS[drill.fieldType as FieldType]}
            </span>
            {drill.subTheme && (
              <span className="rounded-full bg-indigo-50 px-2 py-0.5 font-medium text-indigo-700">
                {drill.subTheme}
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/bibliotheek/${drill.id}/bewerken`}
            className="rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-700">
            Bewerken
          </Link>
          <form action={del}>
            <button type="submit"
              className="rounded-lg border border-red-200 px-4 py-2 font-medium text-red-600 hover:bg-red-50">
              Verwijderen
            </button>
          </form>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <div className="space-y-4">
          <div className="rounded-xl border border-zinc-200 bg-white p-4">
            <AnimatedPitchDiagram footprintX={drill.footprintX} footprintY={drill.footprintY} aids={drill.aids} actions={drill.actions} scale={7} className="w-full" />
          </div>
          <DiagramLegend aids={drill.aids} actions={drill.actions} />
          <MaterialsList tally={stationTally(drill, drill.idealPlayers)} title={`Benodigd materiaal (bij ${drill.idealPlayers} spelers)`} />
        </div>

        <div className="space-y-4">
          <dl className="grid grid-cols-2 gap-3 rounded-xl border border-zinc-200 bg-white p-4 text-sm sm:grid-cols-3">
            <Meta label="Spelers" value={`${drill.minPlayers}–${drill.maxPlayers} (ideaal ${drill.idealPlayers})`} />
            <Meta label="Duur" value={`${drill.durationMin} min`} />
            <Meta label="Ruimte" value={`${drill.footprintX} × ${drill.footprintY} m`} />
            <Meta label="Leeftijd" value={`U${drill.ageMin + 1}–U${drill.ageMax + 1}`} />
          </dl>

          <Prose title="Omschrijving" text={drill.description} />
          {drill.setup && <Prose title="Opstelling" text={drill.setup} />}
          <Steps steps={drillSteps(drill.steps)} />
          {drill.rules && <Prose title="Spelregels" text={drill.rules} />}
          {drill.coachingPoints && <Prose title="Coachpunten" text={drill.coachingPoints} />}
          {drill.progressions && <Prose title="Moeilijker maken" text={drill.progressions} />}
          {drill.simplifications && <Prose title="Makkelijker maken" text={drill.simplifications} />}
          {drill.videoUrl && (
            <a href={drill.videoUrl} target="_blank" rel="noopener noreferrer"
              className="inline-block text-sm font-medium text-emerald-700 hover:underline">
              ▶ Video bekijken
            </a>
          )}
          <p className="text-xs text-zinc-400">Leerdoel U15: {AGE_GOAL.U15}</p>
        </div>
      </div>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-zinc-500">{label}</dt>
      <dd className="font-medium text-zinc-900">{value}</dd>
    </div>
  );
}

function Steps({ steps }: { steps: string[] }) {
  if (steps.length === 0) return null;
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4">
      <h2 className="text-sm font-semibold text-zinc-700">Stappen</h2>
      <ol className="mt-1 list-decimal space-y-1 pl-5 text-sm text-zinc-700">
        {steps.map((s, i) => (
          <li key={i}>{s}</li>
        ))}
      </ol>
    </div>
  );
}

function Prose({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4">
      <h2 className="text-sm font-semibold text-zinc-700">{title}</h2>
      <p className="mt-1 whitespace-pre-line text-sm text-zinc-700">{text}</p>
    </div>
  );
}
