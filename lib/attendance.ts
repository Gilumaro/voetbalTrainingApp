import { prisma } from "./prisma";
import { playerName } from "./players";

export async function listTrainingEvents() {
  return prisma.trainingEvent.findMany({
    orderBy: { date: "desc" },
    include: { _count: { select: { attendance: true } } },
  });
}

export async function getTrainingEvent(id: number) {
  return prisma.trainingEvent.findUnique({
    where: { id },
    include: {
      attendance: { include: { player: true } },
    },
  });
}

export type TrainingEventWithAttendance = NonNullable<
  Awaited<ReturnType<typeof getTrainingEvent>>
>;

export type OverviewRow = {
  playerId: number;
  name: string;
  active: boolean;
  present: number;
  absent: number;
  cleanups: number;
};

/**
 * Per-player attendance & cleanup tallies across all recorded trainings, so the
 * coach can spot who has cleaned up least/most and who is often absent. Sorted by
 * fewest cleanups first (the fairness view for assigning the next cleanup duty).
 */
export async function getAttendanceOverview(): Promise<OverviewRow[]> {
  const players = await prisma.player.findMany({
    orderBy: [{ active: "desc" }, { firstName: "asc" }],
    include: { attendance: true },
  });

  const rows: OverviewRow[] = players.map((p) => {
    const present = p.attendance.filter((a) => a.present).length;
    const absent = p.attendance.filter((a) => !a.present).length;
    const cleanups = p.attendance.filter((a) => a.didCleanup).length;
    return {
      playerId: p.id,
      name: playerName(p),
      active: p.active,
      present,
      absent,
      cleanups,
    };
  });

  return rows.sort(
    (a, b) => a.cleanups - b.cleanups || b.absent - a.absent || a.name.localeCompare(b.name),
  );
}
