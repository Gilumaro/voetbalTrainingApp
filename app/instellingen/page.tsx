import { getSettings } from "@/lib/settings";
import {
  AGE_CATEGORIES,
  SPACE_TYPES,
  SPACE_TYPE_LABELS,
  type SpaceType,
} from "@/lib/enums";
import { updateSettings } from "./actions";

export const dynamic = "force-dynamic";

const DAYS = [
  { value: 1, label: "Maandag" },
  { value: 2, label: "Dinsdag" },
  { value: 3, label: "Woensdag" },
  { value: 4, label: "Donderdag" },
  { value: 5, label: "Vrijdag" },
  { value: 6, label: "Zaterdag" },
  { value: 0, label: "Zondag" },
] as const;

export default async function SettingsPage({
  searchParams,
}: PageProps<"/instellingen">) {
  const settings = await getSettings();
  const saved = (await searchParams).opgeslagen === "1";

  let trainingDays: number[] = [];
  try {
    const parsed = JSON.parse(settings.trainingDays);
    if (Array.isArray(parsed)) trainingDays = parsed as number[];
  } catch {
    // keep empty
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Instellingen</h1>
        <p className="mt-1 text-zinc-600">
          Je beschikbare materialen, veldafmetingen en trainingsplanning.
        </p>
      </div>

      {saved && (
        <p className="rounded-lg bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">
          Instellingen opgeslagen.
        </p>
      )}

      <form action={updateSettings} className="space-y-8">
        <fieldset className="rounded-xl border border-zinc-200 bg-white p-6">
          <legend className="px-2 text-sm font-semibold text-zinc-700">
            Materiaal
          </legend>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <NumberField name="bigGoals" label="Grote doelen" defaultValue={settings.bigGoals} />
            <NumberField name="smallGoals" label="Kleine doelen" defaultValue={settings.smallGoals} />
            <NumberField name="discCones" label="Schijfhoedjes" defaultValue={settings.discCones} />
            <NumberField name="cones" label="Pylonen" defaultValue={settings.cones} />
            <NumberField name="pinnies" label="Hesjes" defaultValue={settings.pinnies} />
            <NumberField name="balls" label="Ballen" defaultValue={settings.balls} />
          </div>
        </fieldset>

        <fieldset className="rounded-xl border border-zinc-200 bg-white p-6">
          <legend className="px-2 text-sm font-semibold text-zinc-700">
            Beschikbare ruimte (meters)
          </legend>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <NumberField name="pitchX" label="Breedte (m)" defaultValue={settings.pitchX} step="1" />
            <NumberField name="pitchY" label="Lengte (m)" defaultValue={settings.pitchY} step="1" />
          </div>
          <p className="mt-3 text-xs text-zinc-500">
            Standaard is een half veld (± 50 × 35 m). Twee parallelle oefeningen moeten
            samen binnen deze ruimte passen.
          </p>
        </fieldset>

        <fieldset className="rounded-xl border border-zinc-200 bg-white p-6">
          <legend className="px-2 text-sm font-semibold text-zinc-700">
            Trainingsdagen
          </legend>
          <p className="mb-4 text-xs text-zinc-500">
            Welke dagen heeft jouw team training? De generator gebruikt dit om automatisch
            trainingen voor het hele seizoen aan te maken.
          </p>
          <div className="flex flex-wrap gap-3">
            {DAYS.map((d) => (
              <label key={d.value} className="flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-200 px-4 py-2.5 transition hover:border-emerald-400 has-[:checked]:border-emerald-500 has-[:checked]:bg-emerald-50">
                <input
                  type="checkbox"
                  name="trainingDay"
                  value={d.value}
                  defaultChecked={trainingDays.includes(d.value)}
                  className="accent-emerald-600"
                />
                <span className="text-sm font-medium text-zinc-800">{d.label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="rounded-xl border border-zinc-200 bg-white p-6">
          <legend className="px-2 text-sm font-semibold text-zinc-700">
            Training standaarden
          </legend>
          <p className="mb-4 text-xs text-zinc-500">
            Standaardwaarden die worden gebruikt als lege trainingen worden aangemaakt voor het seizoen.
            Je kunt ze per training aanpassen als je oefeningen genereert.
          </p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <label className="block">
              <span className="text-sm font-medium text-zinc-700">Leeftijdscategorie</span>
              <select
                name="defaultAgeCategory"
                defaultValue={settings.defaultAgeCategory}
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                {AGE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </label>

            <NumberField
              name="defaultDurationMin"
              label="Duur (min)"
              defaultValue={settings.defaultDurationMin}
              min={30}
              max={120}
            />

            <NumberField
              name="defaultPlayers"
              label="Aantal spelers"
              defaultValue={settings.defaultPlayers}
              min={4}
              max={30}
            />

            <label className="block">
              <span className="text-sm font-medium text-zinc-700">Beschikbare ruimte</span>
              <select
                name="defaultSpaceType"
                defaultValue={settings.defaultSpaceType}
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                {SPACE_TYPES.map((s) => (
                  <option key={s} value={s}>{SPACE_TYPE_LABELS[s as SpaceType]}</option>
                ))}
              </select>
            </label>
          </div>
        </fieldset>

        <button
          type="submit"
          className="rounded-lg bg-emerald-600 px-5 py-2.5 font-semibold text-white transition hover:bg-emerald-700"
        >
          Opslaan
        </button>
      </form>
    </div>
  );
}

function NumberField({
  name,
  label,
  defaultValue,
  step = "1",
  min = 0,
  max,
}: {
  name: string;
  label: string;
  defaultValue: number;
  step?: string;
  min?: number;
  max?: number;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-zinc-700">{label}</span>
      <input
        type="number"
        name={name}
        defaultValue={defaultValue}
        step={step}
        min={min}
        max={max}
        className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
      />
    </label>
  );
}
