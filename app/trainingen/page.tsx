import Link from "next/link";
import { listSessions } from "@/lib/sessions";
import { THEME_LABELS, type Theme } from "@/lib/enums";
import { generateSeasonTrainings, deleteSessionFromList } from "./actions";
import DeleteSessionButton from "@/components/DeleteSessionButton";

export const dynamic = "force-dynamic";

export default async function TrainingenPage() {
  const sessions = await listSessions();
  const del = deleteSessionFromList;

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

      {sessions.length === 0 ? (
        <p className="rounded-xl border border-dashed border-zinc-300 bg-white p-8 text-center text-zinc-500">
          Nog geen trainingen opgeslagen. Genereer een seizoen of klik op "+ Nieuwe genereren".
        </p>
      ) : (
        <ul className="space-y-2">
          {sessions.map((s) => {
            const isEmpty = s.blocks.length === 0;
            const title = s.label ?? new Date(s.date).toLocaleDateString("nl-NL", {
              weekday: "long",
              day: "numeric",
              month: "long",
            });
            const dateLabel = new Date(s.date).toLocaleDateString("nl-NL", {
              weekday: "short",
              day: "numeric",
              month: "long",
            });
            return (
              <li key={s.id} className="flex items-center gap-2">
                <Link
                  href={`/trainingen/${s.id}`}
                  className="flex flex-1 items-center justify-between rounded-xl border border-zinc-200 bg-white px-5 py-4 transition hover:border-emerald-300 hover:shadow"
                >
                  <div>
                    <p className="font-semibold text-zinc-900">{title}</p>
                    <p className="mt-0.5 text-sm text-zinc-500">
                      {isEmpty ? (
                        <span className="inline-flex items-center rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-500">
                          Leeg
                        </span>
                      ) : (
                        <>
                          {THEME_LABELS[s.theme as Theme]} · {s.durationMin} min · {s.players} spelers · {s.blocks.length} blokken
                        </>
                      )}
                    </p>
                  </div>
                  <span className="text-sm text-zinc-400">{dateLabel}</span>
                </Link>
                <DeleteSessionButton sessionId={s.id} deleteAction={del} />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
