import Link from "next/link";
import { listMatches } from "@/lib/matches";
import { HOME_AWAY_LABELS, type HomeAway } from "@/lib/enums";

export const dynamic = "force-dynamic";

function fmtDate(d: Date): string {
  return d.toLocaleDateString("nl-NL", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function MatchesPage() {
  const matches = await listMatches();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Wedstrijden</h1>
          <p className="mt-1 text-zinc-600">{matches.length} wedstrijden</p>
        </div>
        <Link
          href="/wedstrijden/nieuw"
          className="rounded-lg bg-emerald-600 px-4 py-2.5 font-semibold text-white hover:bg-emerald-700"
        >
          + Nieuwe wedstrijd
        </Link>
      </div>

      {matches.length === 0 ? (
        <p className="rounded-xl border border-dashed border-zinc-300 bg-white p-8 text-center text-zinc-500">
          Nog geen wedstrijden gepland.
        </p>
      ) : (
        <ul className="space-y-2">
          {matches.map((m) => (
            <li key={m.id}>
              <Link
                href={`/wedstrijden/${m.id}`}
                className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3 transition hover:border-emerald-300 hover:shadow"
              >
                <div className="min-w-0">
                  <p className="font-medium text-zinc-900">
                    {HOME_AWAY_LABELS[m.homeAway as HomeAway] ?? m.homeAway} ·{" "}
                    {m.opponent}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {fmtDate(m.date)} · {m.formation}
                    {m.result ? ` · ${m.result}` : ""}
                  </p>
                </div>
                <span className="shrink-0 text-xs text-zinc-400">
                  {m._count.lineup} opgesteld
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
