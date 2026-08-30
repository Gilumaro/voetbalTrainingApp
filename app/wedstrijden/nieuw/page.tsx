import Link from "next/link";
import MatchForm from "@/components/MatchForm";
import { getDefaultLineup } from "@/lib/matches";
import { createMatch } from "../actions";

export const dynamic = "force-dynamic";

export default async function NewMatchPage() {
  const template = await getDefaultLineup();
  const hasDefault = !!template && template.entries.length > 0;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/wedstrijden" className="text-sm text-zinc-500 hover:text-zinc-800">
          ← Terug
        </Link>
        <h1 className="mt-1 text-2xl font-semibold text-zinc-900">Nieuwe wedstrijd</h1>
      </div>
      <MatchForm
        action={createMatch}
        submitLabel="Wedstrijd aanmaken"
        defaultFormation={hasDefault ? template.formation : null}
      />
    </div>
  );
}
