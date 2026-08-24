import { prisma } from "./prisma";
import type { DrillType, Theme } from "./enums";

export type DrillFilter = {
  type?: DrillType;
  theme?: Theme;
  q?: string;
};

export async function getDrills(filter: DrillFilter = {}) {
  return prisma.drill.findMany({
    where: {
      type: filter.type,
      theme: filter.theme,
      title: filter.q ? { contains: filter.q } : undefined,
    },
    include: { aids: true },
    orderBy: [{ type: "asc" }, { title: "asc" }],
  });
}

export async function getDrill(id: number) {
  return prisma.drill.findUnique({
    where: { id },
    include: { aids: true },
  });
}

export type DrillWithAids = NonNullable<Awaited<ReturnType<typeof getDrill>>>;
