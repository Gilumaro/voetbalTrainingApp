import Link from "next/link";
import { listTrainingEvents } from "@/lib/attendance";
import { createTrainingEvent, deleteTrainingEvent } from "../actions";

export const dynamic = "force-dynamic";

function fmtDate(d: Date): string {
  return d.toLocaleDateString("nl-NL", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function AttendanceListPage() {
  const events = await listTrainingEvents();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/team" className="text-sm text-zinc-500 hover:text-zinc-800">
            ← Terug naar team
          </Link>
          <h1 className="mt-1 text-2xl font-semibold text-zinc-900">Aanwezigheid</h1>
        </div>
        <Link
          href="/team/overzicht"
          className="rounded-lg border border-zinc-300 px-4 py-2.5 font-medium text-zinc-700 hover:bg-zinc-50"
        >
          Overzicht
        </Link>
      </div>

      <form
        action={createTrainingEvent}
        className="flex flex-wrap items-end gap-3 rounded-xl border border-zinc-200 bg-white p-4"
      >
        <label className="text-sm">
          <span className="block font-medium text-zinc-700">Nieuwe trainingsdatum</span>
          <input
            name="date"
            type="date"
            required
            className="mt-1 rounded-lg border border-zinc-300 px-3 py-2"
          />
        </label>
        <label className="text-sm">
          <span className="block font-medium text-zinc-700">Label (optioneel)</span>
          <input
            name="label"
            placeholder="bv. Veldtraining"
            className="mt-1 rounded-lg border border-zinc-300 px-3 py-2"
          />
        </label>
        <button
          type="submit"
          className="rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-700"
        >
          + Training
        </button>
      </form>

      {events.length === 0 ? (
        <p className="rounded-xl border border-dashed border-zinc-300 bg-white p-8 text-center text-zinc-500">
          Nog geen trainingen vastgelegd.
        </p>
      ) : (
        <ul className="space-y-2">
          {events.map((e) => {
            const del = deleteTrainingEvent.bind(null, e.id);
            return (
              <li
                key={e.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3"
              >
                <Link href={`/team/aanwezigheid/${e.id}`} className="min-w-0 flex-1">
                  <span className="font-medium text-emerald-700 hover:underline">
                    {fmtDate(e.date)}
                  </span>
                  {e.label && <span className="ml-2 text-zinc-500">· {e.label}</span>}
                  <span className="ml-2 text-xs text-zinc-400">
                    {e._count.attendance} geregistreerd
                  </span>
                </Link>
                <form action={del}>
                  <button
                    type="submit"
                    className="text-xs text-zinc-400 hover:text-red-600"
                  >
                    Verwijderen
                  </button>
                </form>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
