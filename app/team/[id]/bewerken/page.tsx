import Link from "next/link";
import { notFound } from "next/navigation";
import { getPlayer } from "@/lib/players";
import PlayerForm from "@/components/PlayerForm";
import { updatePlayer } from "../../actions";

export const dynamic = "force-dynamic";

export default async function EditPlayerPage({
  params,
}: PageProps<"/team/[id]/bewerken">) {
  const { id } = await params;
  const player = await getPlayer(Number(id));
  if (!player) notFound();

  const action = updatePlayer.bind(null, player.id);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/team/${player.id}`}
          className="text-sm text-zinc-500 hover:text-zinc-800"
        >
          ← Terug
        </Link>
        <h1 className="mt-1 text-2xl font-semibold text-zinc-900">Speler bewerken</h1>
      </div>
      <PlayerForm
        action={action}
        submitLabel="Wijzigingen opslaan"
        initial={{
          firstName: player.firstName,
          lastName: player.lastName,
          shirtNumber: player.shirtNumber,
          preferredPosition: player.preferredPosition,
          secondaryPosition: player.secondaryPosition,
          birthDate: player.birthDate,
          active: player.active,
          notes: player.notes,
        }}
      />
    </div>
  );
}
