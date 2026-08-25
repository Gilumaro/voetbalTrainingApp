import PitchDiagram from "./PitchDiagram";
import CombinedPitchDiagram from "./CombinedPitchDiagram";
import DiagramLegend from "./DiagramLegend";
import MaterialsList from "./MaterialsList";
import { mergeTallies, stationTally, maxTally, type MaterialTally } from "@/lib/materials";
import { drillSteps } from "@/lib/drills";
import { AGE_GOAL, THEME_LABELS, type AgeCategory, type Theme } from "@/lib/enums";
import {
  groupBlocksForDisplay,
  rotationSchedule,
  type BlockDraft,
  type DisplayGroup,
  type SessionDraft,
  type StationDraft,
} from "@/lib/generator";

const sideLabel = (side?: string) => (side === "LEFT" ? "links" : side === "RIGHT" ? "rechts" : "");

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
        {groupBlocksForDisplay(draft.blocks).map((g, i) => (
          <li key={i} className="avoid-break">
            {g.kind === "rotation" ? (
              <PrintRotation group={g} availX={availX} availY={availY} />
            ) : (
              <PrintBlock block={g.block} index={g.index} tally={blockTallies[g.index]} availX={availX} availY={availY} />
            )}
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
            <DiagramLegend
              className="mt-2"
              aids={block.stations.flatMap((s) => s.drill.aids)}
              actions={block.stations.flatMap((s) => s.drill.actions)}
            />
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
              actions={block.stations[0].drill.actions}
              scale={5}
              className="w-full"
            />
            <DiagramLegend
              aids={block.stations[0].drill.aids}
              actions={block.stations[0].drill.actions}
            />
            <MaterialsList tally={tally} />
          </div>
          <StationText station={block.stations[0]} whole />
        </div>
      )}
    </div>
  );
}

function PrintRotation({
  group,
  availX,
  availY,
}: {
  group: Extract<DisplayGroup, { kind: "rotation" }>;
  availX: number;
  availY: number;
}) {
  const { blocks, startIndex, endIndex } = group;
  const first = blocks[0];
  const totalMin = blocks.reduce((s, b) => s + b.durationMin, 0);
  const tally = mergeTallies(...first.stations.map((s) => stationTally(s.drill, s.players)));
  const schedule = rotationSchedule(blocks);

  return (
    <div className="rounded-lg border border-zinc-300 p-4">
      <div className="mb-3 flex items-baseline justify-between border-b border-zinc-200 pb-2">
        <h2 className="text-lg font-bold">
          {startIndex + 1}–{endIndex + 1}. Parallelle stations
          <span className="ml-2 text-sm font-normal text-zinc-500">(groepen wisselen)</span>
        </h2>
        <span className="font-semibold">{totalMin} min</span>
      </div>

      <div className="space-y-4">
        <div className="mx-auto max-w-md">
          <CombinedPitchDiagram
            availX={availX}
            availY={availY}
            left={splitShape(first, "LEFT")}
            right={splitShape(first, "RIGHT")}
            scale={7}
            className="w-full"
          />
          <div className="mt-1 flex justify-between text-xs text-zinc-500">
            <span>◀ links</span>
            <span>rechts ▶</span>
          </div>
          <DiagramLegend
            className="mt-2"
            aids={first.stations.flatMap((s) => s.drill.aids)}
            actions={first.stations.flatMap((s) => s.drill.actions)}
          />
        </div>

        <div className="rounded border border-zinc-300 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Rotatie</p>
          <ul className="mt-1 space-y-0.5 text-sm">
            {schedule.map((row) => (
              <li key={row.group}>
                <strong>Groep {row.group}:</strong>{" "}
                {row.stops.map((s, i) => (
                  <span key={i}>
                    {i > 0 && " → "}
                    {sideLabel(s.side)} · {s.drillTitle} ({s.durationMin} min)
                  </span>
                ))}
              </li>
            ))}
          </ul>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {first.stations.map((s, i) => (
            <StationText key={i} station={s} bySide />
          ))}
        </div>
        <MaterialsList tally={tally} title="Materiaal (beide stations)" />
      </div>
    </div>
  );
}

function splitShape(block: BlockDraft, side: "LEFT" | "RIGHT") {
  const s = block.stations.find((st) => st.side === side);
  if (!s) return null;
  return {
    footprintX: s.drill.footprintX,
    footprintY: s.drill.footprintY,
    aids: s.drill.aids,
    actions: s.drill.actions,
  };
}

function StationText({
  station,
  whole,
  bySide,
}: {
  station: StationDraft;
  whole?: boolean;
  bySide?: boolean;
}) {
  const d = station.drill;
  const steps = drillSteps(d.steps);
  const chip = bySide ? `Station ${sideLabel(station.side)}` : `Groep ${station.group}`;
  return (
    <div>
      <h3 className="font-semibold">
        {!whole && <span className="mr-1 rounded bg-zinc-800 px-1.5 text-xs text-white">{chip}</span>}
        {d.title}
        <span className="ml-2 text-xs font-normal text-zinc-500">
          {station.players} spelers · {d.footprintX}×{d.footprintY} m
        </span>
      </h3>
      {d.setup && <p className="mt-1 text-sm"><strong>Opstelling:</strong> {d.setup}</p>}
      {steps.length > 0 ? (
        <ol className="mt-1 list-decimal space-y-0.5 pl-5 text-sm">
          {steps.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ol>
      ) : (
        <p className="mt-1 whitespace-pre-line text-sm">{d.description}</p>
      )}
      {d.rules && <p className="mt-1 text-sm text-zinc-700"><strong>Spelregels:</strong> {d.rules}</p>}
      {d.coachingPoints && (
        <p className="mt-1 text-sm text-zinc-700"><strong>Coaching:</strong> {d.coachingPoints}</p>
      )}
    </div>
  );
}
