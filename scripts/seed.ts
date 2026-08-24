import { prisma } from "../lib/prisma";
import { SEED_DRILLS } from "../lib/seed-data";
import { getSettings } from "../lib/settings";

async function main() {
  // Always ensure the settings singleton exists.
  await getSettings();

  const existing = await prisma.drill.count();
  if (existing > 0) {
    console.log(`Seed skipped: ${existing} drills already present.`);
    return;
  }

  for (const { aids, ...drill } of SEED_DRILLS) {
    await prisma.drill.create({
      data: { ...drill, aids: { create: aids } },
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
