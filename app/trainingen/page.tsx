import Link from "next/link";
import { listSessions } from "@/lib/sessions";
import { generateSeasonTrainings, deleteSessionFromList } from "./actions";
import SessionList from "@/components/SessionList";
import { backfillCleanupAssignments } from "@/lib/attendance";

export const dynamic = "force-dynamic";

export default async function TrainingenPage() {
  await backfillCleanupAssignments();
  const sessions = await listSessions();

  const sessionRows = sessions.map((s) => ({
    id: s.id,
    date: s.date.toISOString(),
    label: s.label,
    theme: s.theme,
    durationMin: s.durationMin,
    players: s.players,
    blocks: s.blocks,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Opgeslagen trainingen</h1>
          <p className="mt-1 text-zinc-600">{sessions.length} trainingen</p>
        </div>
        <div className="flex gap-2">
          <form action={generateSeasonTrainings}>
            <button
              type="submit"
              className="rounded-lg border border-emerald-600 px-4 py-2.5 font-semibold text-emerald-700 transition hover:bg-emerald-50"
            >
              Genereer seizoen
            </button>
          </form>
          <Link
            href="/genereren"
            className="rounded-lg bg-emerald-600 px-4 py-2.5 font-semibold text-white hover:bg-emerald-700"
          >
            + Nieuwe genereren
          </Link>
        </div>
      </div>

      <SessionList sessions={sessionRows} deleteAction={deleteSessionFromList} />
    </div>
  );
}
