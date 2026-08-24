import { getSettings } from "@/lib/settings";
import { updateSettings } from "./actions";

export const dynamic = "force-dynamic";

export default async function SettingsPage({
  searchParams,
}: PageProps<"/instellingen">) {
  const settings = await getSettings();
  const saved = (await searchParams).opgeslagen === "1";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Instellingen</h1>
        <p className="mt-1 text-zinc-600">
          Je beschikbare materialen en veldafmetingen. De generator gebruikt deze om
          te controleren of oefeningen passen en of je genoeg materiaal hebt.
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
}: {
  name: string;
  label: string;
  defaultValue: number;
  step?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-zinc-700">{label}</span>
      <input
        type="number"
        name={name}
        defaultValue={defaultValue}
        step={step}
        min={0}
        className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
      />
    </label>
  );
}
