import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import PlacementEditor from "@/components/PlacementEditor";
import type { DiagramAid } from "@/components/PitchDiagram";
import { saveStationPlacement, resetStationPlacement } from "@/app/trainingen/actions";

export const dynamic = "force-dynamic";

export default async function OpstellingPage({
  params,
}: PageProps<"/trainingen/[id]/station/[stationId]/opstelling">) {
  const { id, stationId } = await params;
  const sessionId = Number(id);
  const station = await prisma.blockStation.findUnique({
    where: { id: Number(stationId) },
    include: { block: true, drill: { include: { aids: true } } },
  });
  if (!station || station.block.sessionId !== sessionId) notFound();

  const current: DiagramAid[] = station.placementOverrides
    ? JSON.parse(station.placementOverrides)
    : station.drill.aids.map((a) => ({ type: a.type, x: a.x, y: a.y, rotation: a.rotation, label: a.label }));

  const save = saveStationPlacement.bind(null, sessionId, station.id);
  const reset = resetStationPlacement.bind(null, sessionId, station.id);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <Link href={`/trainingen/${sessionId}`} className="text-sm text-zinc-500 hover:text-zinc-800">
            ← Terug naar training
          </Link>
          <h1 className="mt-1 text-2xl font-semibold text-zinc-900">Opstelling aanpassen</h1>
          <p className="mt-1 text-zinc-600">{station.drill.title}</p>
        </div>
        <form action={reset}>
          <button type="submit" className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50">
            Herstel standaard
          </button>
        </form>
      </div>

      <PlacementEditor
        footprintX={station.drill.footprintX}
        footprintY={station.drill.footprintY}
        initialAids={current}
        action={save}
      />
    </div>
  );
}
