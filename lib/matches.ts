import { prisma } from "./prisma";
import type { LineupRole } from "./enums";

// A placement per player, keyed by playerId — the shape the builder pre-fills from
// (a saved match lineup, the default template, or the previous match).
export type Placement = {
  role: LineupRole;
  x: number | null;
  y: number | null;
  slot: number | null;
};
export type PlacementMap = Record<number, Placement>;

type RawEntry = {
  playerId: number;
  role: string;
  x: number | null;
  y: number | null;
  slot: number | null;
};

/**
 * Turn stored lineup entries into a placement map keyed by playerId. Slots are kept:
 * the builder adopts the source's formation when a map is applied, so the slot indices
 * still line up.
 */
export function entriesToPlacementMap(entries: RawEntry[]): PlacementMap {
  const map: PlacementMap = {};
  for (const e of entries) {
    map[e.playerId] = {
      role: e.role as LineupRole,
      x: e.x,
      y: e.y,
      slot: e.slot,
    };
  }
  return map;
}

export async function listMatches() {
  return prisma.match.findMany({
    orderBy: { date: "desc" },
    include: { _count: { select: { lineup: true } } },
  });
}

export async function getMatch(id: number) {
  return prisma.match.findUnique({
    where: { id },
    include: { lineup: { include: { player: true } } },
  });
}

export type MatchWithLineup = NonNullable<Awaited<ReturnType<typeof getMatch>>>;

// One row per active player, merged with any existing lineup entry for the match.
// Used to seed the builder: players default to BENCH (available) with no placement.
export type MatchPlayerRow = {
  playerId: number;
  firstName: string;
  lastName: string | null;
  shirtNumber: number | null;
  preferredPosition: string;
  secondaryPosition: string | null;
  role: LineupRole;
  x: number | null;
  y: number | null;
  slot: number | null;
};

export async function matchPlayerRows(
  match: MatchWithLineup,
  fallback?: PlacementMap,
): Promise<MatchPlayerRow[]> {
  const players = await prisma.player.findMany({
    where: { active: true },
    orderBy: [{ shirtNumber: "asc" }, { firstName: "asc" }],
  });
  // Use the match's own saved lineup; if it has none yet, pre-fill from the fallback
  // (default template or previous match) so a fresh match opens ready to tweak.
  const byPlayer = new Map(match.lineup.map((e) => [e.playerId, e]));
  const useFallback = match.lineup.length === 0 && fallback;

  return players.map((p) => {
    const entry = useFallback ? fallback[p.id] : byPlayer.get(p.id);
    return {
      playerId: p.id,
      firstName: p.firstName,
      lastName: p.lastName,
      shirtNumber: p.shirtNumber,
      preferredPosition: p.preferredPosition,
      secondaryPosition: p.secondaryPosition,
      role: (entry?.role as LineupRole) ?? "BENCH",
      x: entry?.x ?? null,
      y: entry?.y ?? null,
      slot: entry?.slot ?? null,
    };
  });
}

/** The coach's saved default/first-choice lineup (singleton), or null if never set. */
export async function getDefaultLineup() {
  return prisma.lineupTemplate.findUnique({
    where: { id: 1 },
    include: { entries: true },
  });
}

/** The most recent match (on/before this one) that has a saved lineup, else null. */
export async function getPreviousMatchLineup(match: { id: number; date: Date }) {
  return prisma.match.findFirst({
    where: {
      id: { not: match.id },
      date: { lte: match.date },
      lineup: { some: {} },
    },
    orderBy: [{ date: "desc" }, { id: "desc" }],
    include: { lineup: true },
  });
}
