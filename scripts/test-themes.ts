import { loadGeneratorContext, generateSession } from "../lib/generator";
import { randomSeed } from "../lib/rng";
import type { Theme } from "../lib/enums";

async function main() {
  const ctx = await loadGeneratorContext();
  const themes: Theme[] = ["ATTACK", "DEFEND", "TRANSITION"];
  for (const theme of themes) {
    const d = generateSession(
      { ageCategory: "U15", theme, durationMin: 75, players: 16, spaceType: "HALF" },
      ctx,
      randomSeed(),
    );
    const exThemes = [
      ...new Set(d.blocks.filter((b) => b.role === "exercise").flatMap((b) => b.stations.map((s) => s.drill.theme))),
    ];
    const split = d.blocks.filter((b) => b.kind === "SPLIT").length;
    const distinctEx = new Set(
      d.blocks.filter((b) => b.role === "exercise").flatMap((b) => b.stations.map((s) => s.drill.title)),
    );
    console.log(
      `${theme.padEnd(11)} | blocks ${d.blocks.length} | split ${split} | exThemes ${exThemes.join(",")} | distinctExercises ${distinctEx.size} | warnings ${d.warnings.length}`,
    );
  }
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
