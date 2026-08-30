import Link from "next/link";
import PlayerForm from "@/components/PlayerForm";
import { createPlayer } from "../actions";

export const dynamic = "force-dynamic";

export default function NewPlayerPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link href="/team" className="text-sm text-zinc-500 hover:text-zinc-800">
          ← Terug
        </Link>
        <h1 className="mt-1 text-2xl font-semibold text-zinc-900">Nieuwe speler</h1>
      </div>
      <PlayerForm action={createPlayer} submitLabel="Speler toevoegen" />
    </div>
  );
}
