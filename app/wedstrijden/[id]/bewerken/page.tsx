import Link from "next/link";
import { notFound } from "next/navigation";
import { getMatch } from "@/lib/matches";
import MatchForm from "@/components/MatchForm";
import { updateMatch } from "../../actions";

export const dynamic = "force-dynamic";

export default async function EditMatchPage({
  params,
}: PageProps<"/wedstrijden/[id]/bewerken">) {
  const { id } = await params;
  const match = await getMatch(Number(id));
  if (!match) notFound();

  const action = updateMatch.bind(null, match.id);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/wedstrijden/${match.id}`}
          className="text-sm text-zinc-500 hover:text-zinc-800"
        >
          ← Terug
        </Link>
        <h1 className="mt-1 text-2xl font-semibold text-zinc-900">Wedstrijd bewerken</h1>
      </div>
      <MatchForm
        action={action}
        submitLabel="Wijzigingen opslaan"
        initial={{
          date: match.date,
          opponent: match.opponent,
          homeAway: match.homeAway,
          formation: match.formation,
          location: match.location,
          result: match.result,
          notes: match.notes,
        }}
      />
    </div>
  );
}
