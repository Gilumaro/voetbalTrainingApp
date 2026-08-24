import Link from "next/link";
import PitchDiagram from "./PitchDiagram";
import CombinedPitchDiagram from "./CombinedPitchDiagram";
import MaterialsList from "./MaterialsList";
import { mergeTallies, stationTally, maxTally, type MaterialTally } from "@/lib/materials";
import { AGE_GOAL, THEME_LABELS, type AgeCategory, type Theme } from "@/lib/enums";
import type { BlockDraft, SessionDraft, StationDraft } from "@/lib/generator";

export default function SessionDraftView({
  draft,
  availX,
  availY,
}: {
  draft: SessionDraft;
  availX: number;
  availY: number;
}) {
  const total = draft.blocks.reduce((sum, b) => sum + b.durationMin, 0);
  // "Gather beforehand" = the most any single block needs at once (gear is reused
  // between blocks, so this is the max per material, not the sum).
  const sessionTally = maxTally(
    draft.blocks.map((b) => mergeTallies(...b.stations.map((s) => stationTally(s.drill, s.players)))),
  );

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-zinc-200 bg-white p-5">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm text-zinc-600">
          <span><strong className="text-zinc-900">Thema:</strong> {THEME_LABELS[draft.input.theme as Theme]}</span>
          <span><strong className="text-zinc-900">Duur:</strong> {total} min</span>
          <span><strong className="text-zinc-900">Spelers:</strong> {draft.input.players}</span>
          <span><strong className="text-zinc-900">Leeftijd:</strong> {draft.input.ageCategory}</span>
        </div>
        <p className="mt-1 text-xs text-zinc-500">Leerdoel: {AGE_GOAL[draft.input.ageCategory as AgeCategory]}</p>
      </div>

      <MaterialsList tally={sessionTally} title="Verzamel vooraf (totaal benodigd materiaal)" />

      {draft.warnings.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 no-print">
          <p className="text-sm font-semibold text-amber-800">Let op</p>
          <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm text-amber-800">
            {draft.warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      <ol className="space-y-4">
        {draft.blocks.map((block, i) => (
          <li key={i}>
            <BlockCard block={block} index={i} availX={availX} availY={availY} />
          </li>
        ))}
      </ol>
    </div>
  );
}

function BlockCard({
  block,
  index,
  availX,
  availY,
}: {
  block: BlockDraft;
  index: number;
  availX: number;
  availY: number;
}) {
  const tally = mergeTallies(...block.stations.map((s) => stationTally(s.drill, s.players)));

  return (
    <div className="avoid-break rounded-xl border border-zinc-200 bg-white p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold text-zinc-900">
          <span className="mr-2 inline-grid h-6 w-6 place-items-center rounded-full bg-zinc-800 text-xs text-white">
            {index + 1}
          </span>
          {block.label}
          {block.kind === "SPLIT" && (
            <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
              2 oefeningen tegelijk
            </span>
          )}
        </h3>
        <span className="text-sm font-medium text-zinc-500">{block.durationMin} min</span>
      </div>

      {block.stations.length === 0 ? (
        <p className="text-sm text-red-500">Geen oefening gevonden voor dit blok.</p>
      ) : block.kind === "SPLIT" ? (
        <SplitBlock block={block} availX={availX} availY={availY} tally={tally} />
      ) : (
        <WholeBlock station={block.stations[0]} tally={tally} />
      )}
    </div>
  );
}

function WholeBlock({ station, tally }: { station: StationDraft; tally: MaterialTally }) {
  const d = station.drill;
  return (
    <div className="grid gap-4 sm:grid-cols-[220px_1fr]">
      <div className="space-y-3">
        <div className="rounded-lg border border-zinc-200 p-2">
          <PitchDiagram footprintX={d.footprintX} footprintY={d.footprintY} aids={d.aids} scale={5} className="w-full" />
        </div>
        <MaterialsList tally={tally} />
      </div>
      <div>
        <StationHeader station={station} />
        <p className="mt-2 whitespace-pre-line text-sm text-zinc-700">{d.description}</p>
        {d.coachingPoints && (
          <p className="mt-2 text-sm text-zinc-600"><strong>Coachpunten:</strong> {d.coachingPoints}</p>
        )}
      </div>
    </div>
  );
}

function SplitBlock({
  block,
  availX,
  availY,
  tally,
}: {
  block: BlockDraft;
  availX: number;
  availY: number;
  tally: MaterialTally;
}) {
  const left = block.stations.find((s) => s.side === "LEFT") ?? block.stations[0];
  const right = block.stations.find((s) => s.side === "RIGHT") ?? block.stations[1];

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <div className="rounded-lg border border-zinc-200 p-2">
        <CombinedPitchDiagram
          availX={availX}
          availY={availY}
          left={left && { footprintX: left.drill.footprintX, footprintY: left.drill.footprintY, aids: left.drill.aids }}
          right={right && { footprintX: right.drill.footprintX, footprintY: right.drill.footprintY, aids: right.drill.aids }}
          scale={6}
          className="w-full"
        />
        <div className="mt-1 flex justify-between px-2 text-xs text-zinc-500">
          <span>◀ links</span>
          <span>rechts ▶</span>
        </div>
      </div>
      <div className="space-y-3">
        {left && <StationDetail station={left} tint="blue" />}
        {right && <StationDetail station={right} tint="orange" />}
        <MaterialsList tally={tally} title="Materiaal (beide stations)" />
      </div>
    </div>
  );
}

function StationDetail({ station, tint }: { station: StationDraft; tint: "blue" | "orange" }) {
  const dot = tint === "blue" ? "bg-blue-500" : "bg-orange-500";
  const d = station.drill;
  return (
    <div className="rounded-lg border border-zinc-200 p-3">
      <div className="flex items-center gap-2">
        <span className={`h-3 w-3 rounded-full ${dot}`} />
        <span className="text-sm font-semibold text-zinc-900">Groep {station.group}</span>
        <span className="text-xs text-zinc-500">· {station.players} spelers</span>
      </div>
      <Link href={`/bibliotheek/${d.id}`} className="mt-1 block text-sm font-medium text-emerald-700 hover:underline">
        {d.title}
      </Link>
      <p className="mt-1 text-xs text-zinc-600">{d.footprintX}×{d.footprintY} m</p>
    </div>
  );
}

function StationHeader({ station }: { station: StationDraft }) {
  const d = station.drill;
  return (
    <Link href={`/bibliotheek/${d.id}`} className="text-base font-semibold text-emerald-700 hover:underline">
      {d.title}
      <span className="ml-2 text-xs font-normal text-zinc-500">
        · hele groep ({station.players} spelers) · {d.footprintX}×{d.footprintY} m
      </span>
    </Link>
  );
}
