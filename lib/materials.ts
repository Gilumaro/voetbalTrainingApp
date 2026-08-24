import type { AidType } from "./enums";

export type MaterialTally = Partial<Record<AidType, number>>;

// Aid types that count as "materials to lay out" (players/markers are not gear).
export const MATERIAL_ORDER: AidType[] = [
  "BIG_GOAL",
  "SMALL_GOAL",
  "DISC_CONE",
  "CONE",
  "BALL",
];

export function tallyAids(aids: { type: string }[]): MaterialTally {
  const t: MaterialTally = {};
  for (const a of aids) {
    const k = a.type as AidType;
    t[k] = (t[k] ?? 0) + 1;
  }
  return t;
}

/** Balls a drill needs for a given number of players, per its ball-scaling rule. */
export function ballsNeeded(
  scaling: string,
  players: number,
  aids: { type: string }[],
): number {
  switch (scaling) {
    case "PER_PLAYER":
      return players;
    case "PER_PAIR":
      return Math.ceil(players / 2);
    default:
      return aids.filter((a) => a.type === "BALL").length;
  }
}

/**
 * Material tally for one drill at a station with `players` players. Balls are computed
 * from the drill's ball-scaling rule (e.g. one per player) instead of the placed markers.
 */
export function stationTally(
  drill: { aids: { type: string }[]; ballScaling?: string | null },
  players: number,
): MaterialTally {
  const t = tallyAids(drill.aids);
  const balls = ballsNeeded(drill.ballScaling ?? "FIXED", players, drill.aids);
  if (balls > 0) t.BALL = balls;
  else delete t.BALL;
  return t;
}

// Max of each material across blocks = the amount the coach needs to own, since
// blocks run one after another and gear is reused.
export function maxTally(tallies: MaterialTally[]): MaterialTally {
  const out: MaterialTally = {};
  for (const t of tallies) {
    for (const [k, v] of Object.entries(t)) {
      out[k as AidType] = Math.max(out[k as AidType] ?? 0, v ?? 0);
    }
  }
  return out;
}

export function mergeTallies(...tallies: MaterialTally[]): MaterialTally {
  const out: MaterialTally = {};
  for (const t of tallies) {
    for (const [k, v] of Object.entries(t)) {
      out[k as AidType] = (out[k as AidType] ?? 0) + (v ?? 0);
    }
  }
  return out;
}
