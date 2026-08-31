import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession, sessionToDraft, type SavedSession, type SavedStation } from "@/lib/sessions";
import { getSettings, spaceDims } from "@/lib/settings";
import { getSessionAttendance } from "@/lib/attendance";
import { getPlayers, playerName } from "@/lib/players";
import SessionDraftView from "@/components/SessionDraftView";
import AttendanceEditor, { type AttendancePlayer } from "@/components/AttendanceEditor";
import {
  deleteSession,
  renameSession,
  setSessionDate,
  setBlockDuration,
  moveBlock,
  swapStationDrill,
  rerollStation,
  addBlock,
  deleteBlock,
  saveAttendance,
} from "../actions";
import { DRILL_TYPE_LABELS, type DrillType } from "@/lib/enums";

export const dynamic = "force-dynamic";

export default async function TrainingDetailPage({ params }: PageProps<"/trainingen/[id]">) {
  const { id } = await params;
  const sessionId = Number(id);
  const session = await getSession(sessionId);
  if (!session) notFound();

  const [settings, allDrills, players, attendance] = await Promise.all([
    getSettings(),
    prisma.drill.findMany({ orderBy: { title: "asc" } }),
    getPlayers({ activeOnly: true }),
    getSessionAttendance(sessionId),
  ]);

  const draft = sessionToDraft(session);
  const del = deleteSession.bind(null, sessionId);
  const rename = renameSession.bind(null, sessionId);
  const setDate = setSessionDate.bind(null, sessionId);
  const dateValue = session.date.toISOString().slice(0, 10);

  // Default everyone to present until the coach records who was absent.
  const recorded = new Map(attendance.map((a) => [a.playerId, a]));
  const attendanceRows: AttendancePlayer[] = players.map((p) => {
    const rec = recorded.get(p.id);
    return {
      playerId: p.id,
      name: playerName(p),
      shirtNumber: p.shirtNumber,
      present: rec ? rec.present : true,
      didCleanup: rec ? rec.didCleanup : false,
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/trainingen" className="text-sm text-zinc-500 hover:text-zinc-800">
            ← Alle trainingen
          </Link>
          <form action={rename} className="mt-1 flex items-center gap-2">
            <input name="label" defaultValue={session.label ?? ""} placeholder="Naam van de training"
              className="w-72 max-w-full rounded-lg border border-zinc-300 px-3 py-1.5 text-lg font-semibold text-zinc-900" />
            <button type="submit" className="rounded-md border border-zinc-300 px-2 py-1.5 text-xs text-zinc-600 hover:bg-zinc-50">
              Naam opslaan
            </button>
          </form>
          <form action={setDate} className="mt-2 flex items-center gap-2">
            <label className="text-sm text-zinc-600">
              <span className="mr-1 font-medium">Datum</span>
              <input type="date" name="date" defaultValue={dateValue}
                className="rounded-lg border border-zinc-300 px-2 py-1.5 text-sm" />
            </label>
            <button type="submit" className="rounded-md border border-zinc-300 px-2 py-1.5 text-xs text-zinc-600 hover:bg-zinc-50">
              Datum opslaan
            </button>
          </form>
        </div>
        <div className="flex gap-2 no-print">
          <Link href={`/trainingen/${sessionId}/print`}
            className="rounded-lg border border-zinc-300 px-4 py-2 font-medium text-zinc-700 hover:bg-zinc-50">
            Print / veldkaart
          </Link>
          <form action={del}>
            <button type="submit" className="rounded-lg border border-red-200 px-4 py-2 font-medium text-red-600 hover:bg-red-50">
              Verwijderen
            </button>
          </form>
        </div>
      </div>

      <SessionDraftView draft={draft} {...spaceDims(settings.pitchX, settings.pitchY, session.spaceType)} />

      <RefinePanel session={session} sessionId={sessionId} allDrills={allDrills} />

      <section className="space-y-4 rounded-xl border border-zinc-200 bg-white p-5 no-print">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900">Aanwezigheid & opruimen</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Vink af wie er was en wie heeft opgeruimd. Telt mee in het{" "}
            <Link href="/team/overzicht" className="text-emerald-700 hover:underline">
              teamoverzicht
            </Link>
            .
          </p>
        </div>
        <AttendanceEditor sessionId={sessionId} players={attendanceRows} action={saveAttendance} />
      </section>
    </div>
  );
}

function RefinePanel({
  session,
  sessionId,
  allDrills,
}: {
  session: SavedSession;
  sessionId: number;
  allDrills: { id: number; title: string; type: string; theme: string }[];
}) {
  const firstSplitId = session.blocks.find((b) => b.kind === "SPLIT")?.id;

  // Representative stations: whole-block stations, plus the split stations once.
  const stationControls: { station: SavedStation; context: string }[] = [];
  for (const b of session.blocks) {
    if (b.kind === "SPLIT") {
      if (b.id === firstSplitId) {
        for (const st of b.stations) {
          stationControls.push({
            station: st,
            context: st.side === "LEFT" ? "Parallel · links" : "Parallel · rechts",
          });
        }
      }
    } else {
      for (const st of b.stations) {
        stationControls.push({ station: st, context: b.label ?? "" });
      }
    }
  }

  return (
    <section className="space-y-5 rounded-xl border border-zinc-200 bg-white p-5 no-print">
      <h2 className="text-lg font-semibold text-zinc-900">Training aanpassen</h2>

      {/* Block order + timing */}
      <div>
        <h3 className="mb-2 text-sm font-semibold text-zinc-600">Blokken & tijd</h3>
        <ul className="space-y-2">
          {session.blocks.map((b, i) => {
            const setDur = setBlockDuration.bind(null, sessionId, b.id);
            const up = moveBlock.bind(null, sessionId, b.id, "up");
            const down = moveBlock.bind(null, sessionId, b.id, "down");
            const del = deleteBlock.bind(null, sessionId, b.id);
            return (
              <li key={b.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2">
                <span className="w-6 text-sm text-zinc-400">{i + 1}</span>
                <span className="flex-1 text-sm font-medium text-zinc-800">{b.label}</span>
                <form action={setDur} className="flex items-center gap-1">
                  <input type="number" name="dur" min={1} max={60} defaultValue={b.durationMin}
                    className="w-16 rounded border border-zinc-300 px-2 py-1 text-sm" />
                  <span className="text-xs text-zinc-500">min</span>
                  <button className="rounded border border-zinc-300 px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-50">ok</button>
                </form>
                <form action={up}><button className="rounded border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-50" disabled={i === 0}>↑</button></form>
                <form action={down}><button className="rounded border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-50" disabled={i === session.blocks.length - 1}>↓</button></form>
                <form action={del}><button className="rounded border border-red-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50" title="Blok verwijderen">✕</button></form>
              </li>
            );
          })}
        </ul>
        <AddBlockForm sessionId={sessionId} session={session} allDrills={allDrills} />
      </div>

      {/* Per-station drill swap / reroll / nudge */}
      <div>
        <h3 className="mb-2 text-sm font-semibold text-zinc-600">Oefeningen wisselen</h3>
        <ul className="space-y-2">
          {stationControls.map(({ station, context }) => {
            const swap = swapStationDrill.bind(null, sessionId, station.id);
            const reroll = rerollStation.bind(null, sessionId, station.id);
            const alternatives = allDrills.filter(
              (d) =>
                d.type === station.drill.type &&
                (station.drill.type !== "EXERCISE" || d.theme === station.drill.theme),
            );
            return (
              <li key={station.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2">
                <span className="w-32 shrink-0 text-xs font-medium text-zinc-500">
                  {DRILL_TYPE_LABELS[station.drill.type as DrillType]}
                  <span className="block text-zinc-400">{context}</span>
                </span>
                <form action={swap} className="flex flex-1 items-center gap-1">
                  <select name="drillId" defaultValue={station.drillId}
                    className="min-w-0 flex-1 rounded border border-zinc-300 px-2 py-1 text-sm">
                    {alternatives.map((d) => (
                      <option key={d.id} value={d.id}>{d.title}</option>
                    ))}
                  </select>
                  <button className="rounded border border-zinc-300 px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-50">Wissel</button>
                </form>
                <form action={reroll}>
                  <button className="rounded border border-zinc-300 px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-50" title="Willekeurig andere oefening">↻</button>
                </form>
                <Link href={`/trainingen/${sessionId}/station/${station.id}/opstelling`}
                  className="rounded border border-zinc-300 px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-50">
                  Opstelling
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

function AddBlockForm({
  sessionId,
  session,
  allDrills,
}: {
  sessionId: number;
  session: SavedSession;
  allDrills: { id: number; title: string; type: string; theme: string }[];
}) {
  const add = addBlock.bind(null, sessionId);
  const total = session.blocks.reduce((sum, b) => sum + b.durationMin, 0);
  const remaining = session.durationMin - total;
  // Suggest filling the remaining time window, but never a nonsensical value.
  const defaultDur = remaining > 0 ? Math.min(remaining, 30) : 15;
  const types: DrillType[] = ["WARMUP", "EXERCISE", "MATCHFORM"];

  return (
    <form action={add} className="mt-3 flex flex-wrap items-end gap-2 rounded-lg border border-dashed border-zinc-300 bg-zinc-50 px-3 py-3">
      <label className="flex min-w-48 flex-1 flex-col gap-1 text-xs font-medium text-zinc-500">
        Extra oefening toevoegen
        <select name="drillId" required defaultValue=""
          className="rounded border border-zinc-300 bg-white px-2 py-1 text-sm text-zinc-800">
          <option value="" disabled>Kies een oefening…</option>
          {types.map((t) => {
            const group = allDrills.filter((d) => d.type === t);
            if (group.length === 0) return null;
            return (
              <optgroup key={t} label={DRILL_TYPE_LABELS[t]}>
                {group.map((d) => (
                  <option key={d.id} value={d.id}>{d.title}</option>
                ))}
              </optgroup>
            );
          })}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-xs font-medium text-zinc-500">
        Duur
        <span className="flex items-center gap-1">
          <input type="number" name="dur" min={1} max={60} defaultValue={defaultDur}
            className="w-16 rounded border border-zinc-300 px-2 py-1 text-sm" />
          <span className="text-xs text-zinc-500">min</span>
        </span>
      </label>
      <button className="rounded-lg bg-emerald-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700">
        + Toevoegen
      </button>
    </form>
  );
}
