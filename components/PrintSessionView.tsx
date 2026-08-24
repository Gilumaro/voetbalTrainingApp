import PitchDiagram from "./PitchDiagram";
import CombinedPitchDiagram from "./CombinedPitchDiagram";
import MaterialsList from "./MaterialsList";
import { mergeTallies, stationTally, maxTally, type MaterialTally } from "@/lib/materials";
import { AGE_GOAL, THEME_LABELS, type AgeCategory, type Theme } from "@/lib/enums";
import type { BlockDraft, SessionDraft, StationDraft } from "@/lib/generator";

/** Clean, field-ready rendering optimised for printing (FR-12). */
export default function PrintSessionView({
  draft,
  title,
  availX,
  availY,
}: {
  draft: SessionDraft;
  title: string;
  availX: number;
  availY: number;
}) {
  const total = draft.blocks.reduce((s, b) => s + b.durationMin, 0);
  const blockTallies = draft.blocks.map((b) =>
    mergeTallies(...b.stations.map((s) => stationTally(s.drill, s.players))),
  );
  const sessionTally = maxTally(blockTallies);

  return (
    <div className="space-y-5 text-zinc-900">
      <header className="border-b border-zinc-300 pb-3">
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="mt-1 text-sm text-zinc-600">
          {THEME_LABELS[draft.input.theme as Theme]} · {draft.input.ageCategory} ·{" "}
          {draft.input.players} spelers · {total} min
        </p>
        <p className="text-xs text-zinc-500">Leerdoel: {AGE_GOAL[draft.input.ageCategory as AgeCategory]}</p>
      </header>

      <div className="avoid-break">
        <MaterialsList tally={sessionTally} title="Totaal benodigd materiaal (neem mee)" />
      </div>

      <ol className="space-y-5">
        {draft.blocks.map((b, i) => (
          <li key={i} className="avoid-break">
            <PrintBlock block={b} index={i} tally={blockTallies[i]} availX={availX} availY={availY} />
          </li>
        ))}
      </ol>
    </div>
  );
}

function PrintBlock({
  block,
  index,
  tally,
  availX,
  availY,
}: {
  block: BlockDraft;
  index: number;
  tally: MaterialTally;
  availX: number;
  availY: number;
}) {
  return (
    <div className="rounded-lg border border-zinc-300 p-4">
      <div className="mb-3 flex items-baseline justify-between border-b border-zinc-200 pb-2">
        <h2 className="text-lg font-bold">
          {index + 1}. {block.label}
          {block.kind === "SPLIT" && (
            <span className="ml-2 text-sm font-normal text-zinc-500">(2 oefeningen tegelijk)</span>
          )}
        </h2>
        <span className="font-semibold">{block.durationMin} min</span>
      </div>

      {block.kind === "SPLIT" ? (
        <div className="space-y-4">
          <div className="mx-auto max-w-md">
            <CombinedPitchDiagram
              availX={availX}
              availY={availY}
              left={splitShape(block, "LEFT")}
              right={splitShape(block, "RIGHT")}
              scale={7}
              className="w-full"
            />
            <div className="mt-1 flex justify-between text-xs text-zinc-500">
              <span>◀ links</span>
              <span>rechts ▶</span>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {block.stations.map((s, i) => (
              <StationText key={i} station={s} />
            ))}
          </div>
          <MaterialsList tally={tally} title="Materiaal (beide stations)" />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-[200px_1fr]">
          <div className="space-y-3">
            <PitchDiagram
              footprintX={block.stations[0].drill.footprintX}
              footprintY={block.stations[0].drill.footprintY}
              aids={block.stations[0].drill.aids}
              scale={5}
              className="w-full"
            />
            <MaterialsList tally={tally} />
          </div>
          <StationText station={block.stations[0]} whole />
        </div>
      )}
    </div>
  );
}

function splitShape(block: BlockDraft, side: "LEFT" | "RIGHT") {
  const s = block.stations.find((st) => st.side === side);
  if (!s) return null;
  return { footprintX: s.drill.footprintX, footprintY: s.drill.footprintY, aids: s.drill.aids };
}

function StationText({ station, whole }: { station: StationDraft; whole?: boolean }) {
  const d = station.drill;
  return (
    <div>
      <h3 className="font-semibold">
        {!whole && <span className="mr-1 rounded bg-zinc-800 px-1.5 text-xs text-white">Groep {station.group}</span>}
        {d.title}
        <span className="ml-2 text-xs font-normal text-zinc-500">
          {station.players} spelers · {d.footprintX}×{d.footprintY} m
        </span>
      </h3>
      <p className="mt-1 whitespace-pre-line text-sm">{d.description}</p>
      {d.coachingPoints && (
        <p className="mt-1 text-sm text-zinc-700"><strong>Coaching:</strong> {d.coachingPoints}</p>
      )}
    </div>
  );
}
