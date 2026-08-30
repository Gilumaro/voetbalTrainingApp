import { prisma } from "../lib/prisma";
import { IMPORTED_DRILLS } from "../lib/imported-drills";
import type { SeedDrill } from "../lib/seed-data";

// Additive drill import: unlike `scripts/seed.ts` (which bails when any drill
// exists), this adds a batch to a populated library without wiping it, so
// coach-created drills are preserved. Idempotent by title: a drill whose title
// already exists is skipped, so re-running the script is safe.

// Same overlap sanity check as the seeder (player ≈0.93 m, cone/ball ≈0.57 m).
function checkOverlaps(drills: SeedDrill[]) {
  const radius = (t: string) =>
    t === "PLAYER" || t === "PLAYER_OPP" ? 0.93 : t === "BIG_GOAL" || t === "SMALL_GOAL" ? 0 : 0.57;
  let warnings = 0;
  for (const d of drills) {
    const figs = d.aids.filter((a) => a.type !== "MARKER");
    for (let i = 0; i < figs.length; i++) {
      for (let j = i + 1; j < figs.length; j++) {
        const a = figs[i], b = figs[j];
        if (a.type.includes("GOAL") || b.type.includes("GOAL")) continue;
        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        if (dist < radius(a.type) + radius(b.type)) {
          warnings++;
          console.warn(
            `  ! overlap in "${d.title}": ${a.type}@(${a.x},${a.y}) / ${b.type}@(${b.x},${b.y}) = ${dist.toFixed(2)}m`,
          );
        }
      }
    }
  }
  if (warnings === 0) console.log("Overlap check: OK (no figures on top of each other).");
}

async function main() {
  checkOverlaps(IMPORTED_DRILLS);

  const existingTitles = new Set(
    (await prisma.drill.findMany({ select: { title: true } })).map((d) => d.title),
  );

  let created = 0;
  let skipped = 0;
  for (const { aids, actions, steps, ...drill } of IMPORTED_DRILLS) {
    if (existingTitles.has(drill.title)) {
      console.log(`Skipped (already present): "${drill.title}"`);
      skipped++;
      continue;
    }
    await prisma.drill.create({
      data: {
        ...drill,
        steps: steps ? JSON.stringify(steps) : null,
        aids: { create: aids },
        actions: actions
          ? { create: actions.map((a, i) => ({ ...a, order: a.order ?? i })) }
          : undefined,
      },
    });
    created++;
  }
  console.log(`Import done: ${created} added, ${skipped} skipped.`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
