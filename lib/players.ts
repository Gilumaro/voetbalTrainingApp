import { prisma } from "./prisma";

export type PlayerFilter = {
  activeOnly?: boolean;
};

export async function getPlayers(filter: PlayerFilter = {}) {
  return prisma.player.findMany({
    where: filter.activeOnly ? { active: true } : undefined,
    orderBy: [{ active: "desc" }, { shirtNumber: "asc" }, { firstName: "asc" }],
  });
}

export async function getPlayer(id: number) {
  return prisma.player.findUnique({
    where: { id },
    include: { comments: { orderBy: { date: "desc" } } },
  });
}

export type PlayerWithComments = NonNullable<Awaited<ReturnType<typeof getPlayer>>>;
export type PlayerRow = Awaited<ReturnType<typeof getPlayers>>[number];

export type PlayerHistoryEntry = {
  date: Date;
  href: string;
  label: string;
};

export type PlayerHistory = {
  absences: PlayerHistoryEntry[];
  cleanups: PlayerHistoryEntry[];
};

/**
 * Dates a player was absent (from a training or a match) and dates they helped
 * clean up (trainings only), each linking to the specific training/match. Absence
 * from a match is read off the lineup role (UNAVAILABLE), since matches have no
 * separate attendance record.
 */
export async function getPlayerHistory(playerId: number): Promise<PlayerHistory> {
  const [absentTrainings, cleanupTrainings, unavailableMatches] = await Promise.all([
    prisma.attendance.findMany({
      where: { playerId, present: false },
      include: { session: true },
    }),
    prisma.attendance.findMany({
      where: { playerId, didCleanup: true },
      include: { session: true },
    }),
    prisma.lineupEntry.findMany({
      where: { playerId, role: "UNAVAILABLE" },
      include: { match: true },
    }),
  ]);

  const absences: PlayerHistoryEntry[] = [
    ...absentTrainings.map((a) => ({
      date: a.session.date,
      href: `/trainingen/${a.sessionId}`,
      label: a.session.label ?? "Training",
    })),
    ...unavailableMatches.map((l) => ({
      date: l.match.date,
      href: `/wedstrijden/${l.matchId}`,
      label: `Wedstrijd vs ${l.match.opponent}`,
    })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  const cleanups: PlayerHistoryEntry[] = cleanupTrainings
    .map((a) => ({
      date: a.session.date,
      href: `/trainingen/${a.sessionId}`,
      label: a.session.label ?? "Training",
    }))
    .sort((a, b) => b.date.getTime() - a.date.getTime());

  return { absences, cleanups };
}

/** "Voornaam Achternaam" (achternaam optional). */
export function playerName(p: { firstName: string; lastName?: string | null }): string {
  return [p.firstName, p.lastName].filter(Boolean).join(" ");
}
