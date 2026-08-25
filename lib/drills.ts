import { prisma } from "./prisma";
import type { DrillType, Theme } from "./enums";

export type DrillFilter = {
  type?: DrillType;
  theme?: Theme;
  subTheme?: string;
  q?: string;
};

export async function getDrills(filter: DrillFilter = {}) {
  return prisma.drill.findMany({
    where: {
      type: filter.type,
      theme: filter.theme,
      subTheme: filter.subTheme,
      title: filter.q ? { contains: filter.q } : undefined,
    },
    include: { aids: true, actions: { orderBy: { order: "asc" } } },
    orderBy: [{ type: "asc" }, { title: "asc" }],
  });
}

export async function getDrill(id: number) {
  return prisma.drill.findUnique({
    where: { id },
    include: { aids: true, actions: { orderBy: { order: "asc" } } },
  });
}

export type DrillWithAids = NonNullable<Awaited<ReturnType<typeof getDrill>>>;

/** Parse a drill's JSON-encoded `steps` column into an ordered string list. */
export function drillSteps(steps: string | null | undefined): string[] {
  if (!steps) return [];
  try {
    const parsed = JSON.parse(steps);
    return Array.isArray(parsed) ? parsed.filter((s) => typeof s === "string") : [];
  } catch {
    return [];
  }
}
