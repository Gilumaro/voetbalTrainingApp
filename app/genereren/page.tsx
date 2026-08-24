import Link from "next/link";
import { loadGeneratorContext, generateSession, type GeneratorInput } from "@/lib/generator";
import { saveGenerated } from "../trainingen/actions";
import { spaceDims } from "@/lib/settings";
import { randomSeed } from "@/lib/rng";
import SessionDraftView from "@/components/SessionDraftView";
import {
  AGE_CATEGORIES,
  SESSION_THEMES,
  SPACE_TYPES,
  SPACE_TYPE_LABELS,
  THEME_LABELS,
  type AgeCategory,
  type SpaceType,
  type Theme,
} from "@/lib/enums";

export const dynamic = "force-dynamic";

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

function parseInput(sp: Record<string, string | string[] | undefined>): GeneratorInput | null {
  const theme = sp.theme as Theme;
  if (!theme || !SESSION_THEMES.includes(theme as (typeof SESSION_THEMES)[number])) return null;
  const ageCategory = (AGE_CATEGORIES.includes(sp.age as AgeCategory) ? sp.age : "U15") as AgeCategory;
  const spaceType = (SPACE_TYPES.includes(sp.space as SpaceType) ? sp.space : "HALF") as SpaceType;
  return {
    ageCategory,
    theme,
    durationMin: clamp(Number(sp.duration) || 75, 30, 120),
    players: clamp(Number(sp.players) || 16, 4, 30),
    spaceType,
  };
}

export default async function GenererenPage({ searchParams }: PageProps<"/genereren">) {
  const sp = await searchParams;
  const input = parseInput(sp);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Training genereren</h1>
        <p className="mt-1 text-zinc-600">
          Kies je uitgangspunten en genereer in één klik een complete training.
        </p>
      </div>

      <GenerateForm sp={sp} />

      {input && <Result input={input} seed={sp.seed ? Number(sp.seed) : randomSeed()} sp={sp} />}
    </div>
  );
}

function GenerateForm({ sp }: { sp: Record<string, string | string[] | undefined> }) {
  const val = (k: string, d: string) => (typeof sp[k] === "string" ? (sp[k] as string) : d);
  const cls = "mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm";

  return (
    <form method="get" className="grid gap-4 rounded-xl border border-zinc-200 bg-white p-5 sm:grid-cols-2 lg:grid-cols-5">
      <label className="block text-sm">
        <span className="font-medium text-zinc-700">Leeftijd</span>
        <select name="age" defaultValue={val("age", "U15")} className={cls}>
          {AGE_CATEGORIES.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
      </label>
      <label className="block text-sm">
        <span className="font-medium text-zinc-700">Thema</span>
        <select name="theme" defaultValue={val("theme", "ATTACK")} className={cls}>
          {SESSION_THEMES.map((t) => (
            <option key={t} value={t}>{THEME_LABELS[t]}</option>
          ))}
        </select>
      </label>
      <label className="block text-sm">
        <span className="font-medium text-zinc-700">Duur (min)</span>
        <select name="duration" defaultValue={val("duration", "75")} className={cls}>
          {[45, 60, 75, 90].map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      </label>
      <label className="block text-sm">
        <span className="font-medium text-zinc-700">Aantal spelers</span>
        <input type="number" name="players" min={4} max={30} defaultValue={val("players", "16")} className={cls} />
      </label>
      <label className="block text-sm">
        <span className="font-medium text-zinc-700">Ruimte</span>
        <select name="space" defaultValue={val("space", "HALF")} className={cls}>
          {SPACE_TYPES.map((s) => (
            <option key={s} value={s}>{SPACE_TYPE_LABELS[s]}</option>
          ))}
        </select>
      </label>
      <div className="sm:col-span-2 lg:col-span-5">
        <button type="submit" className="rounded-lg bg-emerald-600 px-5 py-2.5 font-semibold text-white hover:bg-emerald-700">
          Genereer training
        </button>
      </div>
    </form>
  );
}

async function Result({
  input,
  seed,
  sp,
}: {
  input: GeneratorInput;
  seed: number;
  sp: Record<string, string | string[] | undefined>;
}) {
  const ctx = await loadGeneratorContext();
  const draft = generateSession(input, ctx, seed);
  const { availX, availY } = spaceDims(ctx.settings.pitchX, ctx.settings.pitchY, input.spaceType);

  // "Opnieuw" keeps inputs but forces a new seed.
  const params = new URLSearchParams({
    age: input.ageCategory,
    theme: input.theme,
    duration: String(input.durationMin),
    players: String(input.players),
    space: input.spaceType,
    seed: String(randomSeed()),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-zinc-900">Voorstel</h2>
        <div className="flex gap-2">
          <Link href={`/genereren?${params.toString()}`} className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50">
            ↻ Opnieuw genereren
          </Link>
          <form action={saveGenerated}>
            <input type="hidden" name="age" value={input.ageCategory} />
            <input type="hidden" name="theme" value={input.theme} />
            <input type="hidden" name="duration" value={input.durationMin} />
            <input type="hidden" name="players" value={input.players} />
            <input type="hidden" name="space" value={input.spaceType} />
            <input type="hidden" name="seed" value={seed} />
            <button type="submit" className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
              Bewaren & aanpassen
            </button>
          </form>
        </div>
      </div>
      <SessionDraftView draft={draft} availX={availX} availY={availY} />
    </div>
  );
}
