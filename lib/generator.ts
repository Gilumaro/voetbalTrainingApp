import { prisma } from "./prisma";
import { getSettings, spaceDims } from "./settings";
import { mulberry32, shuffle } from "./rng";
import { mergeTallies, stationTally, ballsNeeded, type MaterialTally } from "./materials";
import {
  AGE_CATEGORY_YEARS,
  type AgeCategory,
  type AidType,
  type BlockKind,
  type SpaceType,
  type StationGroup,
  type StationSide,
  type Theme,
} from "./enums";
import type { DrillWithAids } from "./drills";

// Squad larger than this is split into two parallel stations (§1.5).
const SPLIT_THRESHOLD = 10;

export type GeneratorInput = {
  ageCategory: AgeCategory;
  theme: Theme;
  durationMin: number;
  players: number;
  spaceType: SpaceType;
};

export type StationDraft = {
  drill: DrillWithAids;
  group: StationGroup;
  side: StationSide;
  players: number;
};

export type BlockDraft = {
  kind: BlockKind;
  role: "warmup" | "exercise" | "match";
  label: string;
  durationMin: number;
  stations: StationDraft[];
};

export type SessionDraft = {
  input: GeneratorInput;
  blocks: BlockDraft[];
  warnings: string[];
  seed: number;
};

// ---- display grouping ------------------------------------------------------
// Consecutive SPLIT blocks that share the same two station drills are a single
// *rotation*: the stations are set up once and the groups swap sides between the
// blocks. The UI collapses them into one section so it doesn't look duplicated.
export type DisplayGroup =
  | { kind: "single"; block: BlockDraft; index: number }
  | { kind: "rotation"; blocks: BlockDraft[]; startIndex: number; endIndex: number };

function splitDrillKey(b: BlockDraft): string {
  const bySide = (side: StationSide) => b.stations.find((s) => s.side === side)?.drill.id ?? "";
  return `${bySide("LEFT")}|${bySide("RIGHT")}`;
}

/** Fold the block list into render groups, collapsing rotations (§1.5). */
export function groupBlocksForDisplay(blocks: BlockDraft[]): DisplayGroup[] {
  const out: DisplayGroup[] = [];
  let i = 0;
  while (i < blocks.length) {
    const b = blocks[i];
    if (b.kind === "SPLIT") {
      const key = splitDrillKey(b);
      let j = i + 1;
      while (j < blocks.length && blocks[j].kind === "SPLIT" && splitDrillKey(blocks[j]) === key) j++;
      if (j - i >= 2) {
        out.push({ kind: "rotation", blocks: blocks.slice(i, j), startIndex: i, endIndex: j - 1 });
        i = j;
        continue;
      }
    }
    out.push({ kind: "single", block: b, index: i });
    i++;
  }
  return out;
}

/** For each group, the side + duration it spends at each rotation stop. */
export function rotationSchedule(blocks: BlockDraft[]): {
  group: StationGroup;
  stops: { side: StationSide | undefined; drillTitle: string | undefined; durationMin: number }[];
}[] {
  const groups: StationGroup[] = [];
  for (const b of blocks)
    for (const s of b.stations) if (!groups.includes(s.group)) groups.push(s.group);
  return groups.map((g) => ({
    group: g,
    stops: blocks.map((b) => {
      const st = b.stations.find((s) => s.group === g);
      return { side: st?.side, drillTitle: st?.drill.title, durationMin: b.durationMin };
    }),
  }));
}

export type GeneratorContext = {
  drills: DrillWithAids[];
  settings: Awaited<ReturnType<typeof getSettings>>;
  recentDrillIds: Set<number>;
};

/** Load everything the generator needs: library, inventory, recently-used drills. */
export async function loadGeneratorContext(
  recentSessions = 3,
): Promise<GeneratorContext> {
  const [drills, settings, recent] = await Promise.all([
    prisma.drill.findMany({
      include: { aids: true, actions: { orderBy: { order: "asc" } } },
    }),
    getSettings(),
    prisma.session.findMany({
      orderBy: { createdAt: "desc" },
      take: recentSessions,
      include: { blocks: { include: { stations: true } } },
    }),
  ]);
  const recentDrillIds = new Set<number>();
  for (const s of recent)
    for (const b of s.blocks)
      for (const st of b.stations) recentDrillIds.add(st.drillId);
  return { drills, settings, recentDrillIds };
}

// ---- geometry / fit --------------------------------------------------------
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/** Does a footprint fit an available rectangle, allowing a 90° rotation? */
function fitsRect(fx: number, fy: number, ax: number, ay: number): boolean {
  const e = 0.01;
  return (fx <= ax + e && fy <= ay + e) || (fy <= ax + e && fx <= ay + e);
}

// ---- scoring / selection ---------------------------------------------------
function scoreDrill(
  d: DrillWithAids,
  targetPlayers: number,
  availX: number,
  availY: number,
  age: number,
  recent: Set<number>,
  availBalls: number,
): number {
  let s = 0;
  if (fitsRect(d.footprintX, d.footprintY, availX, availY)) s += 3;
  else s -= 3;
  if (targetPlayers >= d.minPlayers && targetPlayers <= d.maxPlayers) s += 3;
  else s -= Math.min(4, Math.abs(targetPlayers - clamp(targetPlayers, d.minPlayers, d.maxPlayers)));
  s -= Math.abs(targetPlayers - d.idealPlayers) * 0.3;
  if (age >= d.ageMin && age <= d.ageMax) s += 1;
  else s -= 1;
  if (recent.has(d.id)) s -= 5;
  // Strongly avoid drills that need more balls than the coach owns.
  if (ballsNeeded(d.ballScaling ?? "FIXED", targetPlayers, d.aids) > availBalls) s -= 6;
  return s;
}

function rank(
  candidates: DrillWithAids[],
  targetPlayers: number,
  availX: number,
  availY: number,
  age: number,
  recent: Set<number>,
  availBalls: number,
  rnd: () => number,
): DrillWithAids[] {
  return shuffle(candidates, rnd)
    .map((d) => ({ d, sc: scoreDrill(d, targetPlayers, availX, availY, age, recent, availBalls) }))
    .sort((a, b) => b.sc - a.sc)
    .map((x) => x.d);
}

// ---- block plan ------------------------------------------------------------
type PlannedBlock = { role: BlockDraft["role"]; label: string; durationMin: number };

function planBlocks(durationMin: number): PlannedBlock[] {
  const warmup = Math.round(clamp(durationMin * 0.18, 8, 15));
  const match = Math.round(clamp(durationMin * 0.28, 15, 25));
  const remaining = Math.max(10, durationMin - warmup - match);
  const nExercise = remaining >= 30 ? 2 : 1; // 2 → groups can rotate through 2 stations
  const per = Math.round(remaining / nExercise);

  const plan: PlannedBlock[] = [
    { role: "warmup", label: "Warming-up", durationMin: warmup },
  ];
  for (let i = 0; i < nExercise; i++) {
    plan.push({
      role: "exercise",
      label: nExercise > 1 ? `Parallel ${i + 1}` : "Oefening",
      durationMin: per,
    });
  }
  plan.push({ role: "match", label: "Partijvorm", durationMin: match });
  return plan;
}

// ---- validation ------------------------------------------------------------
const INVENTORY_MAP: [AidType, keyof GeneratorContext["settings"], string][] = [
  ["BIG_GOAL", "bigGoals", "grote doelen"],
  ["SMALL_GOAL", "smallGoals", "kleine doelen"],
  ["DISC_CONE", "discCones", "schijfhoedjes"],
  ["CONE", "cones", "pylonen"],
  ["BALL", "balls", "ballen"],
];

function checkInventory(
  tally: MaterialTally,
  settings: GeneratorContext["settings"],
  label: string,
  warnings: string[],
) {
  for (const [aid, key, name] of INVENTORY_MAP) {
    const need = tally[aid] ?? 0;
    const have = settings[key] as number;
    if (need > have) {
      warnings.push(`Blok "${label}": ${need} ${name} nodig, maar ${have} beschikbaar.`);
    }
  }
}

// ---- main ------------------------------------------------------------------
export function generateSession(
  input: GeneratorInput,
  ctx: GeneratorContext,
  seed: number,
): SessionDraft {
  const rnd = mulberry32(seed);
  const warnings: string[] = [];
  const age = AGE_CATEGORY_YEARS[input.ageCategory];
  const { availX, availY } = spaceDims(ctx.settings.pitchX, ctx.settings.pitchY, input.spaceType);
  const availBalls = ctx.settings.balls;
  const split = input.players > SPLIT_THRESHOLD;
  const groupA = Math.ceil(input.players / 2);
  const groupB = Math.floor(input.players / 2);
  const perGroup = split ? Math.round(input.players / 2) : input.players;

  const plan = planBlocks(input.durationMin);
  const nExerciseBlocks = plan.filter((p) => p.role === "exercise").length;

  // --- pick warm-up (whole group) ---
  const warmupCands = ctx.drills.filter((d) => d.type === "WARMUP");
  const warmup = rank(warmupCands, input.players, availX, availY, age, ctx.recentDrillIds, availBalls, rnd)[0];
  if (!warmup) warnings.push("Geen geschikte warming-up gevonden in de bibliotheek.");

  // --- pick match form (whole group, prefer theme, else neutral) ---
  let matchCands = ctx.drills.filter(
    (d) => d.type === "MATCHFORM" && (d.theme === input.theme || d.theme === "NEUTRAL"),
  );
  if (matchCands.length === 0) matchCands = ctx.drills.filter((d) => d.type === "MATCHFORM");
  const match = rank(matchCands, input.players, availX, availY, age, ctx.recentDrillIds, availBalls, rnd)[0];
  if (!match) warnings.push("Geen geschikte partijvorm gevonden in de bibliotheek.");

  // --- pick exercises ---
  // For split sessions every exercise MUST fit its half of the pitch (rotation allowed),
  // so two stations never overlap. This is a hard requirement, not just a preference.
  const exAvailX = split ? availX / 2 : availX;
  const fitsSpace = (d: DrillWithAids) => fitsRect(d.footprintX, d.footprintY, exAvailX, availY);

  let exerciseCands = ctx.drills.filter(
    (d) => d.type === "EXERCISE" && d.theme === input.theme && fitsSpace(d),
  );
  if (exerciseCands.length < 2) {
    warnings.push(
      `Weinig passende oefeningen voor dit thema binnen de ${split ? "halve " : ""}ruimte; oefeningen van andere thema's worden ook overwogen.`,
    );
    exerciseCands = ctx.drills.filter((d) => d.type === "EXERCISE" && fitsSpace(d));
  }
  if (exerciseCands.length < 2) {
    // Last resort: allow non-fitting drills but keep the coach warned.
    warnings.push(`Er passen te weinig oefeningen in de beschikbare ruimte — vergroot de ruimte of voeg kleinere oefeningen toe.`);
    exerciseCands = ctx.drills.filter((d) => d.type === "EXERCISE" && d.theme === input.theme);
    if (exerciseCands.length < 2) exerciseCands = ctx.drills.filter((d) => d.type === "EXERCISE");
  }
  const rankedExercises = rank(
    exerciseCands,
    perGroup,
    exAvailX,
    availY,
    age,
    ctx.recentDrillIds,
    availBalls,
    rnd,
  );

  // For split sessions we reuse the SAME two stations across the exercise blocks so
  // the coach sets them up once and groups rotate. For small squads we pick a distinct
  // exercise per whole-group exercise block.
  const stationsNeeded = split ? 2 : nExerciseBlocks;
  const chosenExercises = rankedExercises.slice(0, stationsNeeded);
  if (chosenExercises.length < stationsNeeded) {
    warnings.push("Niet genoeg oefeningen in de bibliotheek om alle blokken te vullen.");
  }

  // --- assemble blocks ---
  const blocks: BlockDraft[] = [];
  let exBlockIdx = 0;
  for (const p of plan) {
    if (p.role === "warmup") {
      blocks.push({
        kind: "WHOLE",
        role: "warmup",
        label: p.label,
        durationMin: p.durationMin,
        stations: warmup
          ? [{ drill: warmup, group: "ALL", side: "FULL", players: input.players }]
          : [],
      });
    } else if (p.role === "match") {
      blocks.push({
        kind: "WHOLE",
        role: "match",
        label: p.label,
        durationMin: p.durationMin,
        stations: match
          ? [{ drill: match, group: "ALL", side: "FULL", players: input.players }]
          : [],
      });
    } else {
      // exercise block
      if (split && chosenExercises.length >= 2) {
        const [s1, s2] = chosenExercises;
        const swap = exBlockIdx % 2 === 1; // rotate groups between the two split blocks
        blocks.push({
          kind: "SPLIT",
          role: "exercise",
          label: p.label,
          durationMin: p.durationMin,
          stations: [
            {
              drill: s1,
              group: (swap ? "B" : "A") as StationGroup,
              side: "LEFT",
              players: swap ? groupB : groupA,
            },
            {
              drill: s2,
              group: (swap ? "A" : "B") as StationGroup,
              side: "RIGHT",
              players: swap ? groupA : groupB,
            },
          ],
        });
      } else if (!split && chosenExercises[exBlockIdx]) {
        blocks.push({
          kind: "WHOLE",
          role: "exercise",
          label: p.label,
          durationMin: p.durationMin,
          stations: [
            { drill: chosenExercises[exBlockIdx], group: "ALL", side: "FULL", players: input.players },
          ],
        });
      }
      exBlockIdx++;
    }
  }

  // --- validate materials + fit per block ---
  for (const b of blocks) {
    if (b.stations.length === 0) continue;
    const tally = mergeTallies(...b.stations.map((s) => stationTally(s.drill, s.players)));
    checkInventory(tally, ctx.settings, b.label, warnings);

    if (b.kind === "SPLIT") {
      const halfX = availX / 2;
      for (const s of b.stations) {
        if (!fitsRect(s.drill.footprintX, s.drill.footprintY, halfX, availY)) {
          warnings.push(
            `Blok "${b.label}": oefening "${s.drill.title}" (${s.drill.footprintX}×${s.drill.footprintY} m) past mogelijk niet op de halve ruimte (${Math.round(halfX)}×${Math.round(availY)} m).`,
          );
        }
      }
    } else {
      for (const s of b.stations) {
        if (!fitsRect(s.drill.footprintX, s.drill.footprintY, availX, availY)) {
          warnings.push(
            `Blok "${b.label}": "${s.drill.title}" (${s.drill.footprintX}×${s.drill.footprintY} m) past niet in de beschikbare ruimte (${availX}×${availY} m).`,
          );
        }
      }
    }
  }

  return { input, blocks, warnings, seed };
}
