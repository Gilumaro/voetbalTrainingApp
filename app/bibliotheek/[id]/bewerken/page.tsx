import Link from "next/link";
import { notFound } from "next/navigation";
import { getDrill, drillSteps } from "@/lib/drills";
import DrillForm from "@/components/DrillForm";
import { updateDrill } from "../../actions";
import type { AidType } from "@/lib/enums";

export const dynamic = "force-dynamic";

export default async function DrillEditPage({
  params,
}: PageProps<"/bibliotheek/[id]/bewerken">) {
  const { id } = await params;
  const drill = await getDrill(Number(id));
  if (!drill) notFound();

  const action = updateDrill.bind(null, drill.id);

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/bibliotheek/${drill.id}`} className="text-sm text-zinc-500 hover:text-zinc-800">
          ← Terug
        </Link>
        <h1 className="mt-1 text-2xl font-semibold text-zinc-900">Oefening bewerken</h1>
      </div>
      <DrillForm
        action={action}
        submitLabel="Wijzigingen opslaan"
        initial={{
          title: drill.title,
          type: drill.type,
          theme: drill.theme,
          subTheme: drill.subTheme,
          ageMin: drill.ageMin,
          ageMax: drill.ageMax,
          fieldType: drill.fieldType,
          footprintX: drill.footprintX,
          footprintY: drill.footprintY,
          minPlayers: drill.minPlayers,
          idealPlayers: drill.idealPlayers,
          maxPlayers: drill.maxPlayers,
          durationMin: drill.durationMin,
          ballScaling: drill.ballScaling,
          description: drill.description,
          setup: drill.setup,
          steps: drillSteps(drill.steps),
          rules: drill.rules,
          coachingPoints: drill.coachingPoints,
          progressions: drill.progressions,
          simplifications: drill.simplifications,
          videoUrl: drill.videoUrl,
          aids: drill.aids.map((a) => ({
            type: a.type as AidType,
            x: a.x,
            y: a.y,
            rotation: a.rotation,
            label: a.label,
          })),
          actions: drill.actions.map((a) => ({
            kind: a.kind,
            fromX: a.fromX,
            fromY: a.fromY,
            toX: a.toX,
            toY: a.toY,
            label: a.label,
          })),
        }}
      />
    </div>
  );
}
