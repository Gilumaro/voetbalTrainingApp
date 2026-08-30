import Link from "next/link";
import { notFound } from "next/navigation";
import { getTrainingEvent } from "@/lib/attendance";
import { getPlayers, playerName } from "@/lib/players";
import AttendanceEditor, {
  type AttendancePlayer,
} from "@/components/AttendanceEditor";
import { saveAttendance } from "../../actions";

export const dynamic = "force-dynamic";

function fmtDate(d: Date): string {
  return d.toLocaleDateString("nl-NL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function AttendanceDetailPage({
  params,
}: PageProps<"/team/aanwezigheid/[id]">) {
  const { id } = await params;
  const eventId = Number(id);
  const [event, players] = await Promise.all([
    getTrainingEvent(eventId),
    getPlayers({ activeOnly: true }),
  ]);
  if (!event) notFound();

  const existing = new Map(event.attendance.map((a) => [a.playerId, a]));
  // Default to present when nothing recorded yet (coach unchecks the absentees).
  const rows: AttendancePlayer[] = players.map((p) => {
    const rec = existing.get(p.id);
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
      <div>
        <Link
          href="/team/aanwezigheid"
          className="text-sm text-zinc-500 hover:text-zinc-800"
        >
          ← Terug
        </Link>
        <h1 className="mt-1 text-2xl font-semibold text-zinc-900">
          {fmtDate(event.date)}
        </h1>
        {event.label && <p className="mt-1 text-zinc-600">{event.label}</p>}
      </div>

      <AttendanceEditor eventId={eventId} players={rows} action={saveAttendance} />
    </div>
  );
}
