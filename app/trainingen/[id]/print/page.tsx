import Link from "next/link";
import { notFound } from "next/navigation";
import { getSession, sessionToDraft } from "@/lib/sessions";
import { getSettings, spaceDims } from "@/lib/settings";
import PrintSessionView from "@/components/PrintSessionView";
import PrintButton from "@/components/PrintButton";

export const dynamic = "force-dynamic";

export default async function PrintPage({ params }: PageProps<"/trainingen/[id]/print"> ) {
  const { id } = await params;
  const session = await getSession(Number(id));
  if (!session) notFound();

  const settings = await getSettings();
  const draft = sessionToDraft(session);
  const title = session.label ?? `Training #${session.id}`;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between no-print">
        <Link href={`/trainingen/${session.id}`} className="text-sm text-zinc-500 hover:text-zinc-800">
          ← Terug naar training
        </Link>
        <PrintButton />
      </div>

      <PrintSessionView draft={draft} title={title} {...spaceDims(settings.pitchX, settings.pitchY, session.spaceType)} />
    </div>
  );
}
