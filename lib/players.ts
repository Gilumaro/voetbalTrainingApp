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

/** "Voornaam Achternaam" (achternaam optional). */
export function playerName(p: { firstName: string; lastName?: string | null }): string {
  return [p.firstName, p.lastName].filter(Boolean).join(" ");
}
