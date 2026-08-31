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

// Some spaces are a concrete, fixed field rather than a scaling of the half-pitch.
// The club's "Oefenveld" is a 15 m × 60 m strip: we map its LONG axis to availX so
// the generator splits it along its length (two 30 × 15 m halves) instead of across
// its narrow 15 m width, and diagrams render it as a landscape strip.
const FIXED_SPACE_DIMS: Record<string, { availX: number; availY: number }> = {
  PRACTICE: { availX: 60, availY: 15 },
};

export function spaceDims(
  pitchX: number,
  pitchY: number,
  spaceType: string,
): { availX: number; availY: number } {
  const fixed = FIXED_SPACE_DIMS[spaceType];
  if (fixed) return fixed;
  const f = SPACE_FACTOR[spaceType] ?? 1;
  return { availX: Math.round(pitchX * f), availY: Math.round(pitchY * f) };
}
