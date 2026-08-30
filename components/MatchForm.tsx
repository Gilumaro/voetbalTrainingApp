import { HOME_AWAY, HOME_AWAY_LABELS } from "@/lib/enums";
import { FORMATIONS, FORMATION_KEYS } from "@/lib/formations";

export type MatchFormValues = {
  date?: Date | string | null;
  opponent: string;
  homeAway: string;
  formation: string;
  location?: string | null;
  result?: string | null;
  notes?: string | null;
};

function toDateInput(d: Date | string | null | undefined): string {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

const inputClass =
  "mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 focus:border-emerald-500 focus:outline-none";

export default function MatchForm({
  action,
  initial,
  submitLabel = "Opslaan",
  defaultFormation,
}: {
  action: (formData: FormData) => void | Promise<void>;
  initial?: MatchFormValues;
  submitLabel?: string;
  // When set (new match + a default lineup exists), offer "use the default lineup
  // (with players)" as the first Opstelling choice, pre-selected.
  defaultFormation?: string | null;
}) {
  const formationValue = initial?.formation ?? (defaultFormation ? "__default__" : "4-3-3");
  return (
    <form action={action} className="max-w-2xl space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm">
          <span className="block font-medium text-zinc-700">Datum</span>
          <input
            name="date"
            type="date"
            required
            defaultValue={toDateInput(initial?.date)}
            className={inputClass}
          />
        </label>
        <label className="text-sm">
          <span className="block font-medium text-zinc-700">Tegenstander</span>
          <input
            name="opponent"
            required
            defaultValue={initial?.opponent ?? ""}
            className={inputClass}
          />
        </label>
        <label className="text-sm">
          <span className="block font-medium text-zinc-700">Thuis / uit</span>
          <select
            name="homeAway"
            defaultValue={initial?.homeAway ?? "THUIS"}
            className={inputClass}
          >
            {HOME_AWAY.map((h) => (
              <option key={h} value={h}>
                {HOME_AWAY_LABELS[h]}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="block font-medium text-zinc-700">Opstelling</span>
          <select name="formation" defaultValue={formationValue} className={inputClass}>
            {defaultFormation ? (
              <>
                <option value="__default__">
                  Standaardopstelling gebruiken — {defaultFormation} (met spelers)
                </option>
                <optgroup label="Andere opstelling — zelf spelers plaatsen">
                  {FORMATION_KEYS.map((k) => (
                    <option key={k} value={k}>
                      {FORMATIONS[k].label}
                    </option>
                  ))}
                </optgroup>
              </>
            ) : (
              FORMATION_KEYS.map((k) => (
                <option key={k} value={k}>
                  {FORMATIONS[k].label}
                </option>
              ))
            )}
          </select>
        </label>
        <label className="text-sm">
          <span className="block font-medium text-zinc-700">Locatie (optioneel)</span>
          <input
            name="location"
            defaultValue={initial?.location ?? ""}
            className={inputClass}
          />
        </label>
        <label className="text-sm">
          <span className="block font-medium text-zinc-700">Uitslag (optioneel)</span>
          <input
            name="result"
            placeholder="bv. 3-1"
            defaultValue={initial?.result ?? ""}
            className={inputClass}
          />
        </label>
      </div>

      <label className="text-sm">
        <span className="block font-medium text-zinc-700">Notitie</span>
        <textarea
          name="notes"
          rows={3}
          defaultValue={initial?.notes ?? ""}
          className={inputClass}
        />
      </label>

      <button
        type="submit"
        className="rounded-lg bg-emerald-600 px-5 py-2.5 font-semibold text-white hover:bg-emerald-700"
      >
        {submitLabel}
      </button>
    </form>
  );
}
