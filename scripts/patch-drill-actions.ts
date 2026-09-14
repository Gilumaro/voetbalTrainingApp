import { prisma } from "../lib/prisma";

// One-time patch: adds RUN actions for player A in "Dubbele 1-2 en afronden".
// Safe to re-run (replaces actions completely each time).
async function main() {
  const drill = await prisma.drill.findFirst({
    where: { title: "Dubbele 1-2 en afronden" },
  });
  if (!drill) {
    console.error('Drill "Dubbele 1-2 en afronden" not found — nothing to patch.');
    process.exit(1);
  }

  const newActions = [
    { kind: "PASS", fromX: 11.6, fromY: 25, toX: 5,  toY: 19,  label: "1" },
    { kind: "RUN",  fromX: 10,   fromY: 25, toX: 10,  toY: 22,  label: null },
    { kind: "PASS", fromX: 5,    fromY: 19, toX: 10,  toY: 22,  label: "2 – kaats" },
    { kind: "PASS", fromX: 10,   fromY: 22, toX: 17,  toY: 17,  label: "3" },
    { kind: "RUN",  fromX: 10,   fromY: 22, toX: 12,  toY: 20,  label: null },
    { kind: "PASS", fromX: 17,   fromY: 17, toX: 11,  toY: 11,  label: "4 – terug" },
    { kind: "PASS", fromX: 11,   fromY: 11, toX: 12,  toY: 20,  label: "5 – diep" },
    { kind: "SHOT", fromX: 12,   fromY: 20, toX: 11,  toY: 3.6, label: "afronden" },
  ];

  await prisma.$transaction([
    prisma.drillAction.deleteMany({ where: { drillId: drill.id } }),
    prisma.drillAction.createMany({
      data: newActions.map((a, i) => ({
        drillId: drill.id,
        order: i + 1,
        kind: a.kind,
        fromX: a.fromX,
        fromY: a.fromY,
        toX: a.toX,
        toY: a.toY,
        label: a.label,
      })),
    }),
  ]);

  console.log(`Patched ${newActions.length} actions for drill id=${drill.id} "${drill.title}"`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => { console.error(e); prisma.$disconnect(); process.exit(1); });
