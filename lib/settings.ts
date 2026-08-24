import { prisma } from "./prisma";

export type Inventory = {
  bigGoals: number;
  smallGoals: number;
  discCones: number;
  cones: number;
  pinnies: number;
  balls: number;
};

/** Ensure the singleton Settings row (id = 1) exists and return it. */
export async function getSettings() {
  const existing = await prisma.settings.findUnique({ where: { id: 1 } });
  if (existing) return existing;
  return prisma.settings.create({ data: { id: 1 } });
}

// The configured pitch dimensions represent the coach's default HALF field. The
// on-demand "Ruimte" choice scales that up/down for a given session.
const SPACE_FACTOR: Record<string, number> = {
  QUARTER: 0.7,
  HALF: 1,
  FULL: 1.4,
  INDOOR: 0.6,
};

export function spaceDims(
  pitchX: number,
  pitchY: number,
  spaceType: string,
): { availX: number; availY: number } {
  const f = SPACE_FACTOR[spaceType] ?? 1;
  return { availX: Math.round(pitchX * f), availY: Math.round(pitchY * f) };
}
