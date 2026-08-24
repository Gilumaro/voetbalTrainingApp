import { loadGeneratorContext, generateSession } from "../lib/generator";

async function main() {
  const ctx = await loadGeneratorContext();
  const draft = generateSession(
    { ageCategory: "U15", theme: "ATTACK", durationMin: 75, players: 16, spaceType: "HALF" },
    ctx,
    42,
  );

  console.log("Blocks:");
  for (const b of draft.blocks) {
    console.log(
      `  ${b.label} [${b.kind}] ${b.durationMin}min — ${b.stations
        .map((s) => `${s.group}:${s.drill.title} (${s.drill.theme})`)
        .join(" | ")}`,
    );
  }

  const splits = draft.blocks.filter((b) => b.kind === "SPLIT");
  console.log("\nAssertions:");
  console.log("  total blocks =", draft.blocks.length);
  console.log("  split blocks =", splits.length, "(expect 2)");
  console.log("  total duration =", draft.blocks.reduce((s, b) => s + b.durationMin, 0), "(target 75)");

  if (splits.length === 2) {
    const l1 = splits[0].stations.find((s) => s.side === "LEFT")!;
    const l2 = splits[1].stations.find((s) => s.side === "LEFT")!;
    console.log("  same station reused on LEFT across split blocks =", l1.drill.id === l2.drill.id);
    console.log("  group rotated on LEFT =", `${l1.group} -> ${l2.group}`);
  }

  const exThemes = [
    ...new Set(
      draft.blocks.filter((b) => b.role === "exercise").flatMap((b) => b.stations.map((s) => s.drill.theme)),
    ),
  ];
  console.log("  exercise themes =", exThemes.join(", "), "(expect only ATTACK)");
  console.log("  warnings =", draft.warnings.length ? draft.warnings : "none");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
