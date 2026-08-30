import Link from "next/link";
import { notFound } from "next/navigation";
import {
  entriesToPlacementMap,
  getDefaultLineup,
  getMatch,
  getPreviousMatchLineup,
  matchPlayerRows,
} from "@/lib/matches";
import LineupPitch from "@/components/LineupPitch";
import { HOME_AWAY_LABELS, type HomeAway } from "@/lib/enums";
import { deleteMatch, saveDefaultLineup, saveLineup } from "../actions";

export const dynamic = "force-dynamic";

function fmtDate(d: Date): string {
  return d.toLocaleDateString("nl-NL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function MatchDetailPage({
  params,
}: PageProps<"/wedstrijden/[id]">) {
  const { id } = await params;
  const match = await getMatch(Number(id));
  if (!match) notFound();

  const [template, prevMatch] = await Promise.all([
    getDefaultLineup(),
    getPreviousMatchLineup(match),
  ]);

  // Whether to prefill (default lineup + its formation) is chosen at match creation, so
  // here we just show the match's own lineup. These maps power the builder's manual
  // "use default" / "copy previous" buttons.
  const defaultPlacements =
    template && template.entries.length > 0
      ? entriesToPlacementMap(template.entries)
      : undefined;
  const defaultFormation = template?.formation;
  const previousPlacements = prevMatch
    ? entriesToPlacementMap(prevMatch.lineup)
    : null;
  const previousFormation = prevMatch?.formation ?? null;

  const rows = await matchPlayerRows(match);
  const del = deleteMatch.bind(null, match.id);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            href="/wedstrijden"
            className="text-sm text-zinc-500 hover:text-zinc-800"
          >
            ← Terug
          </Link>
          <h1 className="mt-1 text-2xl font-semibold text-zinc-900">
            {HOME_AWAY_LABELS[match.homeAway as HomeAway] ?? match.homeAway} ·{" "}
            {match.opponent}
          </h1>
          <p className="mt-1 text-zinc-600">
            {fmtDate(match.date)} · Opstelling {match.formation}
            {match.location ? ` · ${match.location}` : ""}
            {match.result ? ` · ${match.result}` : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/wedstrijden/${match.id}/bewerken`}
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

      {rows.length === 0 ? (
        <p className="rounded-xl border border-dashed border-zinc-300 bg-white p-8 text-center text-zinc-500">
          Nog geen actieve spelers. Voeg eerst spelers toe aan het{" "}
          <Link href="/team" className="text-emerald-700 hover:underline">
            team
          </Link>
          .
        </p>
      ) : (
        <LineupPitch
          matchId={match.id}
          formation={match.formation}
          players={rows}
          action={saveLineup}
          saveDefaultAction={saveDefaultLineup}
          defaultPlacements={defaultPlacements}
          defaultFormation={defaultFormation}
          previousPlacements={previousPlacements}
          previousFormation={previousFormation}
        />
      )}
    </div>
  );
}
