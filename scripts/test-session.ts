import { prisma } from "../lib/prisma";
import { loadGeneratorContext, generateSession } from "../lib/generator";
import { getSession, sessionToDraft } from "../lib/sessions";

async function main() {
  const ctx = await loadGeneratorContext();
  const draft = generateSession(
    { ageCategory: "U15", theme: "DEFEND", durationMin: 75, players: 16, spaceType: "HALF" },
    ctx,
    7,
  );

  const created = await prisma.session.create({
    data: {
      ageCategory: "U15",
      theme: "DEFEND",
      durationMin: 75,
      players: 16,
      spaceType: "HALF",
      label: "TEST — refine flow",
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
  console.log("Created session id:", created.id);

  const saved = await getSession(created.id);
  const back = sessionToDraft(saved!);
  console.log("Blocks:", back.blocks.map((b) => `${b.label}[${b.kind}]`).join(", "));

  // Simulate a drill swap on the LEFT split station and confirm BOTH split blocks update.
  const splitBlocks = saved!.blocks.filter((b) => b.kind === "SPLIT");
  const leftStation = splitBlocks[0].stations.find((s) => s.side === "LEFT")!;
  const oldDrillId = leftStation.drillId;
  const alt = await prisma.drill.findFirst({
    where: { type: "EXERCISE", theme: "DEFEND", id: { not: oldDrillId } },
  });
  const targetIds = splitBlocks
    .flatMap((b) => b.stations)
    .filter((s) => s.side === "LEFT" && s.drillId === oldDrillId)
    .map((s) => s.id);
  await prisma.blockStation.updateMany({ where: { id: { in: targetIds } }, data: { drillId: alt!.id } });

  const after = await getSession(created.id);
  const leftDrillIds = after!.blocks
    .filter((b) => b.kind === "SPLIT")
    .map((b) => b.stations.find((s) => s.side === "LEFT")!.drillId);
  console.log("LEFT drill ids across split blocks after swap:", leftDrillIds, "(expect identical =", alt!.id, ")");
  console.log("Rotation preserved:", leftDrillIds.every((v) => v === alt!.id));
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
