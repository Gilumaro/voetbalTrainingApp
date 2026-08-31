import Link from "next/link";
import { listSessions } from "@/lib/sessions";
import { THEME_LABELS, type Theme } from "@/lib/enums";

export const dynamic = "force-dynamic";

export default async function TrainingenPage() {
  const sessions = await listSessions();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Opgeslagen trainingen</h1>
          <p className="mt-1 text-zinc-600">{sessions.length} trainingen</p>
        </div>
        <Link href="/genereren" className="rounded-lg bg-emerald-600 px-4 py-2.5 font-semibold text-white hover:bg-emerald-700">
          + Nieuwe genereren
        </Link>
      </div>

      {sessions.length === 0 ? (
        <p className="rounded-xl border border-dashed border-zinc-300 bg-white p-8 text-center text-zinc-500">
          Nog geen trainingen opgeslagen. Genereer er een en klik op “Bewaren”.
        </p>
      ) : (
        <ul className="space-y-2">
          {sessions.map((s) => (
            <li key={s.id}>
              <Link href={`/trainingen/${s.id}`}
                className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-5 py-4 transition hover:border-emerald-300 hover:shadow">
                <div>
                  <p className="font-semibold text-zinc-900">{s.label ?? `Training #${s.id}`}</p>
                  <p className="mt-0.5 text-sm text-zinc-500">
                    {THEME_LABELS[s.theme as Theme]} · {s.durationMin} min · {s.players} spelers · {s.blocks.length} blokken
                  </p>
                </div>
                <span className="text-sm text-zinc-400">
                  {new Date(s.date).toLocaleDateString("nl-NL", {
                    weekday: "short",
                    day: "numeric",
                    month: "long",
                  })}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
