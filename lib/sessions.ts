import { prisma } from "./prisma";
import type { SessionDraft, BlockDraft, StationDraft } from "./generator";
import type {
  AgeCategory,
  BlockKind,
  SpaceType,
  StationGroup,
  StationSide,
  Theme,
} from "./enums";
import type { DrillWithAids } from "./drills";

export async function getSession(id: number) {
  return prisma.session.findUnique({
    where: { id },
    include: {
      blocks: {
        orderBy: { order: "asc" },
        include: {
          stations: {
            orderBy: { order: "asc" },
            include: {
              drill: { include: { aids: true, actions: { orderBy: { order: "asc" } } } },
            },
          },
        },
      },
    },
  });
}

export type SavedSession = NonNullable<Awaited<ReturnType<typeof getSession>>>;
export type SavedBlock = SavedSession["blocks"][number];
export type SavedStation = SavedBlock["stations"][number];

export async function listSessions() {
  return prisma.session.findMany({
    orderBy: { date: "asc" },
    include: { blocks: { select: { id: true } } },
  });
}

/** A saved station's aids, using the coach's nudged overrides when present (FR-6e). */
export function stationDrill(st: SavedStation): DrillWithAids {
  if (st.placementOverrides) {
    try {
      const aids = JSON.parse(st.placementOverrides);
      return { ...st.drill, aids } as unknown as DrillWithAids;
    } catch {
      /* fall through to defaults */
    }
  }
  return st.drill;
}

function stationPlayers(session: SavedSession, block: SavedBlock, st: SavedStation): number {
  if (block.kind !== "SPLIT") return session.players;
  return st.group === "A"
    ? Math.ceil(session.players / 2)
    : Math.floor(session.players / 2);
}

/** Adapt a persisted session to the shared SessionDraft shape used by the views. */
export function sessionToDraft(session: SavedSession): SessionDraft {
  const blocks: BlockDraft[] = session.blocks.map((b) => ({
    kind: b.kind as BlockKind,
    role: b.label?.includes("Warming")
      ? "warmup"
      : b.label?.includes("Partij")
        ? "match"
        : "exercise",
    label: b.label ?? "",
    durationMin: b.durationMin,
    stations: b.stations.map<StationDraft>((st) => ({
      drill: stationDrill(st),
      group: st.group as StationGroup,
      side: st.side as StationSide,
      players: stationPlayers(session, b, st),
    })),
  }));

  return {
    input: {
      ageCategory: session.ageCategory as AgeCategory,
      theme: session.theme as Theme,
      durationMin: session.durationMin,
      players: session.players,
      spaceType: session.spaceType as SpaceType,
    },
    blocks,
    warnings: [],
    seed: 0,
  };
}
