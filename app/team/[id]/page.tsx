import Link from "next/link";
import { notFound } from "next/navigation";
import { getPlayer, getPlayerHistory, playerName, type PlayerHistoryEntry } from "@/lib/players";
import { POSITION_LABELS, type PositionCode } from "@/lib/enums";
import { addPlayerComment, deletePlayer, deletePlayerComment } from "../actions";

export const dynamic = "force-dynamic";

function fmtDate(d: Date): string {
  return d.toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function PlayerDetailPage({ params }: PageProps<"/team/[id]">) {
  const { id } = await params;
  const player = await getPlayer(Number(id));
  if (!player) notFound();

  const history = await getPlayerHistory(player.id);

  const del = deletePlayer.bind(null, player.id);
  const addComment = addPlayerComment.bind(null, player.id);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/team" className="text-sm text-zinc-500 hover:text-zinc-800">
            ← Terug naar team
          </Link>
          <h1 className="mt-1 text-2xl font-semibold text-zinc-900">
            {player.shirtNumber != null && (
              <span className="mr-2 text-zinc-400">{player.shirtNumber}</span>
            )}
            {playerName(player)}
          </h1>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/team/${player.id}/bewerken`}
            className="rounded-lg border border-zinc-300 px-4 py-2 font-medium text-zinc-700 hover:bg-zinc-50"
          >
            Bewerken
          </Link>
          <form action={del}>
            <button
              type="submit"
              className="rounded-lg border border-red-200 px-4 py-2 font-medium text-red-600 hover:bg-red-50"
            >
              Verwijderen
            </button>
          </form>
        </div>
      </div>

      <dl className="grid gap-4 rounded-xl border border-zinc-200 bg-white p-5 sm:grid-cols-2">
        <Field label="Voorkeurspositie">
          {POSITION_LABELS[player.preferredPosition as PositionCode] ??
            player.preferredPosition}
        </Field>
        <Field label="Tweede positie">
          {player.secondaryPosition
            ? (POSITION_LABELS[player.secondaryPosition as PositionCode] ??
              player.secondaryPosition)
            : "—"}
        </Field>
        <Field label="Geboortedatum">
          {player.birthDate ? fmtDate(player.birthDate) : "—"}
        </Field>
        <Field label="Status">{player.active ? "Actief" : "Inactief"}</Field>
        {player.notes && (
          <div className="sm:col-span-2">
            <Field label="Notitie">{player.notes}</Field>
          </div>
        )}
      </dl>

      <div className="grid gap-6 sm:grid-cols-2">
        <HistorySection title="Afwezig geweest" entries={history.absences} fmtDate={fmtDate} />
        <HistorySection
          title="Opruimdienst ingepland"
          entries={history.cleanupsUpcoming}
          fmtDate={fmtDate}
        />
        <HistorySection
          title="Opruimdienst gedaan"
          entries={history.cleanupsPast}
          fmtDate={fmtDate}
        />
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-zinc-900">Opmerkingen</h2>

        <form action={addComment} className="flex gap-2">
          <input
            name="text"
            required
            placeholder="Nieuwe opmerking…"
            className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
          />
          <button
            type="submit"
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            Toevoegen
          </button>
        </form>

        {player.comments.length === 0 ? (
          <p className="text-sm text-zinc-500">Nog geen opmerkingen.</p>
        ) : (
          <ul className="space-y-2">
            {player.comments.map((c) => {
              const delComment = deletePlayerComment.bind(null, c.id, player.id);
              return (
                <li
                  key={c.id}
                  className="flex items-start justify-between gap-3 rounded-lg border border-zinc-200 bg-white px-4 py-2.5"
                >
                  <div>
                    <p className="text-sm text-zinc-800">{c.text}</p>
                    <p className="mt-0.5 text-xs text-zinc-400">{fmtDate(c.date)}</p>
                  </div>
                  <form action={delComment}>
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
      </section>
    </div>
  );
}

function HistorySection({
  title,
  entries,
  fmtDate,
}: {
  title: string;
  entries: PlayerHistoryEntry[];
  fmtDate: (d: Date) => string;
}) {
  return (
    <section className="space-y-2 rounded-xl border border-zinc-200 bg-white p-5">
      <h2 className="text-sm font-semibold text-zinc-900">{title}</h2>
      {entries.length === 0 ? (
        <p className="text-sm text-zinc-500">Geen data.</p>
      ) : (
        <ul className="space-y-1.5">
          {entries.map((entry, i) => (
            <li key={i}>
              <Link
                href={entry.href}
                className="flex items-baseline justify-between gap-3 text-sm text-emerald-700 hover:underline"
              >
                <span>{entry.label}</span>
                <span className="shrink-0 text-xs text-zinc-400">{fmtDate(entry.date)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-zinc-400">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm text-zinc-800">{children}</dd>
    </div>
  );
}
