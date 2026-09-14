"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  loadGeneratorContext,
  generateSession,
  type GeneratorInput,
} from "@/lib/generator";
import {
  AGE_CATEGORIES,
  SESSION_THEMES,
  SPACE_TYPES,
  THEME_LABELS,
  type AgeCategory,
  type SpaceType,
  type Theme,
} from "@/lib/enums";
import { parseAttendanceForm, parseSessionDate } from "@/lib/validation";
import { getSettings } from "@/lib/settings";

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

function inputFromForm(formData: FormData): GeneratorInput {
  const theme = String(formData.get("theme")) as Theme;
  const age = String(formData.get("age")) as AgeCategory;
  const space = String(formData.get("space")) as SpaceType;
  return {
    ageCategory: AGE_CATEGORIES.includes(age) ? age : "U15",
    theme: SESSION_THEMES.includes(theme as (typeof SESSION_THEMES)[number]) ? theme : "ATTACK",
    durationMin: clamp(Number(formData.get("duration")) || 75, 30, 120),
    players: clamp(Number(formData.get("players")) || 16, 4, 30),
    spaceType: SPACE_TYPES.includes(space) ? space : "HALF",
  };
}

function defaultLabel(input: GeneratorInput): string {
  const date = new Date().toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "long",
  });
  return `${THEME_LABELS[input.theme]} — ${date}`;
}

/** Persist the currently-shown generated draft (regenerated deterministically by seed). */
export async function saveGenerated(formData: FormData) {
  const input = inputFromForm(formData);
  const seed = Number(formData.get("seed")) || 1;
  const date = parseSessionDate(formData.get("date")) ?? new Date();
  const ctx = await loadGeneratorContext();
  const draft = generateSession(input, ctx, seed);

  const created = await prisma.session.create({
    data: {
      date,
      ageCategory: input.ageCategory,
      theme: input.theme,
      durationMin: input.durationMin,
      players: input.players,
      spaceType: input.spaceType,
      label: defaultLabel(input),
      blocks: {
        create: draft.blocks.map((b, i) => ({
          order: i,
          kind: b.kind,
          durationMin: b.durationMin,
          label: b.label,
          stations: {
            create: b.stations.map((st, j) => ({
              order: j,
              group: st.group,
              side: st.side,
              drillId: st.drill.id,
            })),
          },
        })),
      },
    },
  });

  revalidatePath("/trainingen");
  redirect(`/trainingen/${created.id}`);
}

/** Record who was present and who cleaned up for this training. Replaces the lot. */
export async function saveAttendance(sessionId: number, formData: FormData) {
  const rows = parseAttendanceForm(formData);
  await prisma.$transaction([
    prisma.attendance.deleteMany({ where: { sessionId } }),
    prisma.attendance.createMany({
      data: rows.map((r) => ({
        sessionId,
        playerId: r.playerId,
        present: r.present,
        didCleanup: r.didCleanup,
      })),
    }),
  ]);
  revalidatePath(`/trainingen/${sessionId}`);
  revalidatePath("/team/overzicht");
}

export async function deleteSession(sessionId: number) {
  await prisma.session.delete({ where: { id: sessionId } });
  revalidatePath("/trainingen");
  redirect("/trainingen");
}

export async function renameSession(sessionId: number, formData: FormData) {
  const label = String(formData.get("label") ?? "").trim().slice(0, 120) || null;
  await prisma.session.update({ where: { id: sessionId }, data: { label } });
  revalidatePath(`/trainingen/${sessionId}`);
}

export async function setSessionDate(sessionId: number, formData: FormData) {
  const date = parseSessionDate(formData.get("date"));
  if (!date) return;
  await prisma.session.update({ where: { id: sessionId }, data: { date } });
  revalidatePath(`/trainingen/${sessionId}`);
  revalidatePath("/trainingen");
}

/** Add an extra whole-group drill block to the end of a session. */
export async function addBlock(sessionId: number, formData: FormData) {
  const drillId = Number(formData.get("drillId"));
  if (!drillId) return;
  const drill = await prisma.drill.findUnique({ where: { id: drillId } });
  if (!drill) return;

  const dur = clamp(Number(formData.get("dur")) || drill.durationMin || 15, 1, 60);
  const last = await prisma.sessionBlock.aggregate({
    where: { sessionId },
    _max: { order: true },
  });
  const order = (last._max.order ?? -1) + 1;

  await prisma.sessionBlock.create({
    data: {
      sessionId,
      order,
      kind: "WHOLE",
      durationMin: dur,
      label: drill.title,
      stations: {
        create: [{ order: 0, group: "ALL", side: "FULL", drillId }],
      },
    },
  });
  revalidatePath(`/trainingen/${sessionId}`);
}

/** Remove a block (and its stations, via cascade) from a session. */
export async function deleteBlock(sessionId: number, blockId: number) {
  await prisma.sessionBlock.delete({ where: { id: blockId } });
  revalidatePath(`/trainingen/${sessionId}`);
}

export async function setBlockDuration(sessionId: number, blockId: number, formData: FormData) {
  const dur = clamp(Number(formData.get("dur")) || 1, 1, 60);
  await prisma.sessionBlock.update({ where: { id: blockId }, data: { durationMin: dur } });
  revalidatePath(`/trainingen/${sessionId}`);
}

export async function moveBlock(sessionId: number, blockId: number, dir: "up" | "down") {
  const blocks = await prisma.sessionBlock.findMany({
    where: { sessionId },
    orderBy: { order: "asc" },
  });
  const idx = blocks.findIndex((b) => b.id === blockId);
  const swapWith = dir === "up" ? idx - 1 : idx + 1;
  if (idx < 0 || swapWith < 0 || swapWith >= blocks.length) return;

  const a = blocks[idx];
  const b = blocks[swapWith];
  await prisma.$transaction([
    prisma.sessionBlock.update({ where: { id: a.id }, data: { order: b.order } }),
    prisma.sessionBlock.update({ where: { id: b.id }, data: { order: a.order } }),
  ]);
  revalidatePath(`/trainingen/${sessionId}`);
}

/**
 * Change a station's drill. For split blocks, the same physical station appears in both
 * rotation blocks (same side + same drill), so update all of them together to keep the
 * "set up once, groups rotate" logic intact.
 */
async function applyDrillChange(sessionId: number, stationId: number, newDrillId: number) {
  const station = await prisma.blockStation.findUnique({
    where: { id: stationId },
    include: { block: true },
  });
  if (!station) return;

  if (station.block.kind === "SPLIT") {
    const splitBlocks = await prisma.sessionBlock.findMany({
      where: { sessionId, kind: "SPLIT" },
      include: { stations: true },
    });
    const ids = splitBlocks
      .flatMap((b) => b.stations)
      .filter((s) => s.side === station.side && s.drillId === station.drillId)
      .map((s) => s.id);
    await prisma.blockStation.updateMany({
      where: { id: { in: ids } },
      data: { drillId: newDrillId },
    });
  } else {
    await prisma.blockStation.update({
      where: { id: stationId },
      data: { drillId: newDrillId },
    });
  }
  // A drill change invalidates any nudged placement overrides for that station set.
  await prisma.blockStation.updateMany({
    where: { blockId: station.blockId, side: station.side },
    data: { placementOverrides: null },
  });
}

export async function swapStationDrill(sessionId: number, stationId: number, formData: FormData) {
  const newDrillId = Number(formData.get("drillId"));
  if (newDrillId) await applyDrillChange(sessionId, stationId, newDrillId);
  revalidatePath(`/trainingen/${sessionId}`);
}

export async function rerollStation(sessionId: number, stationId: number) {
  const station = await prisma.blockStation.findUnique({
    where: { id: stationId },
    include: { drill: true },
  });
  if (!station) return;

  const candidates = await prisma.drill.findMany({
    where: {
      type: station.drill.type,
      theme: station.drill.type === "EXERCISE" ? station.drill.theme : undefined,
      id: { not: station.drillId },
    },
  });
  if (candidates.length === 0) return;
  const pick = candidates[Math.floor(Math.random() * candidates.length)];
  await applyDrillChange(sessionId, stationId, pick.id);
  revalidatePath(`/trainingen/${sessionId}`);
}

export async function resetStationPlacement(sessionId: number, stationId: number) {
  await prisma.blockStation.update({
    where: { id: stationId },
    data: { placementOverrides: null },
  });
  redirect(`/trainingen/${sessionId}`);
}

export async function saveStationPlacement(sessionId: number, stationId: number, formData: FormData) {
  let overrides: string | null = null;
  try {
    const parsed = JSON.parse(String(formData.get("aids") ?? "[]"));
    overrides = JSON.stringify(parsed);
  } catch {
    overrides = null;
  }
  await prisma.blockStation.update({
    where: { id: stationId },
    data: { placementOverrides: overrides },
  });
  redirect(`/trainingen/${sessionId}`);
}

// ---------------------------------------------------------------------------
// Season generation
// ---------------------------------------------------------------------------

function currentSeasonRange(): { start: Date; end: Date } {
  const now = new Date();
  const year = now.getFullYear();
  const startYear = now.getMonth() >= 7 ? year : year - 1;
  return {
    start: new Date(startYear, 7, 1),   // Aug 1
    end:   new Date(startYear + 1, 5, 30), // Jun 30
  };
}

/** Bulk-create empty sessions for every configured training day in the current season. */
export async function generateSeasonTrainings() {
  const settings = await getSettings();

  let trainingDays: number[] = [];
  try {
    const parsed = JSON.parse(settings.trainingDays);
    if (Array.isArray(parsed)) trainingDays = parsed as number[];
  } catch { /* ignore */ }

  if (trainingDays.length === 0) {
    revalidatePath("/trainingen");
    return;
  }

  const { start, end } = currentSeasonRange();

  // Fetch existing session dates in the season as YYYY-MM-DD strings for deduplication.
  const existing = await prisma.session.findMany({
    where: { date: { gte: start, lte: end } },
    select: { date: true },
  });
  const existingDates = new Set(
    existing.map((s) => s.date.toISOString().slice(0, 10)),
  );

  const toCreate: Date[] = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    if (trainingDays.includes(cursor.getDay())) {
      const iso = cursor.toISOString().slice(0, 10);
      if (!existingDates.has(iso)) {
        toCreate.push(new Date(cursor));
      }
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  if (toCreate.length > 0) {
    await prisma.session.createMany({
      data: toCreate.map((date) => ({
        date,
        label: null,
        ageCategory: settings.defaultAgeCategory,
        theme: "ATTACK",
        durationMin: settings.defaultDurationMin,
        players: settings.defaultPlayers,
        spaceType: settings.defaultSpaceType,
      })),
    });
  }

  revalidatePath("/trainingen");
}

/** Delete a session and stay on the overview (no redirect). */
export async function deleteSessionFromList(sessionId: number) {
  await prisma.session.delete({ where: { id: sessionId } });
  revalidatePath("/trainingen");
}

// ---------------------------------------------------------------------------
// Generate / regenerate drills for an existing session
// ---------------------------------------------------------------------------

/** Generate (or regenerate) drills for an already-persisted session. */
export async function generateDrillsForSession(sessionId: number, formData: FormData) {
  const input = inputFromForm(formData);
  const seed = Number(formData.get("seed")) || Math.floor(Math.random() * 1_000_000);
  const ctx = await loadGeneratorContext();
  const draft = generateSession(input, ctx, seed);

  await prisma.$transaction([
    prisma.sessionBlock.deleteMany({ where: { sessionId } }),
    prisma.session.update({
      where: { id: sessionId },
      data: {
        ageCategory: input.ageCategory,
        theme: input.theme,
        durationMin: input.durationMin,
        players: input.players,
        spaceType: input.spaceType,
        blocks: {
          create: draft.blocks.map((b, i) => ({
            order: i,
            kind: b.kind,
            durationMin: b.durationMin,
            label: b.label,
            stations: {
              create: b.stations.map((st, j) => ({
                order: j,
                group: st.group,
                side: st.side,
                drillId: st.drill.id,
              })),
            },
          })),
        },
      },
    }),
  ]);

  revalidatePath(`/trainingen/${sessionId}`);
  revalidatePath("/trainingen");
}
