import { prisma } from "../lib/prisma";
import { SEED_DRILLS } from "../lib/seed-data";
import { getSettings } from "../lib/settings";

// Dev sanity check: warn if any two figures (not lines) sit on top of each other.
// Player radius ≈0.93 m, cone/ball ≈0.57 m at diagram scale; flag real overlaps.
function checkOverlaps() {
  const radius = (t: string) =>
    t === "PLAYER" || t === "PLAYER_OPP" ? 0.93 : t === "BIG_GOAL" || t === "SMALL_GOAL" ? 0 : 0.57;
  let warnings = 0;
  for (const d of SEED_DRILLS) {
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
  checkOverlaps();
  // Always ensure the settings singleton exists.
  await getSettings();

  const existing = await prisma.drill.count();
  if (existing > 0) {
    console.log(`Seed skipped: ${existing} drills already present.`);
    return;
  }

  for (const { aids, actions, steps, ...drill } of SEED_DRILLS) {
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
  }
  console.log(`Seeded ${SEED_DRILLS.length} drills + settings.`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
