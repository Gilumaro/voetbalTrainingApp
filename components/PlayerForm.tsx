import { POSITION_CODES, POSITION_LABELS } from "@/lib/enums";

export type PlayerFormValues = {
  firstName: string;
  lastName?: string | null;
  shirtNumber?: number | null;
  preferredPosition: string;
  secondaryPosition?: string | null;
  birthDate?: Date | string | null;
  active: boolean;
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

/**
 * Player create/edit form. Presentational: it renders a native <form> that posts to
 * the bound server action, so no client JS is needed for these scalar fields.
 */
export default function PlayerForm({
  action,
  initial,
  submitLabel = "Opslaan",
}: {
  action: (formData: FormData) => void | Promise<void>;
  initial?: PlayerFormValues;
  submitLabel?: string;
}) {
  return (
    <form action={action} className="max-w-2xl space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm">
          <span className="block font-medium text-zinc-700">Voornaam</span>
          <input
            name="firstName"
            required
            defaultValue={initial?.firstName ?? ""}
            className={inputClass}
          />
        </label>
        <label className="text-sm">
          <span className="block font-medium text-zinc-700">Achternaam</span>
          <input
            name="lastName"
            defaultValue={initial?.lastName ?? ""}
            className={inputClass}
          />
        </label>
        <label className="text-sm">
          <span className="block font-medium text-zinc-700">Rugnummer</span>
          <input
            name="shirtNumber"
            type="number"
            min={1}
            max={99}
            defaultValue={initial?.shirtNumber ?? ""}
            className={inputClass}
          />
        </label>
        <label className="text-sm">
          <span className="block font-medium text-zinc-700">Geboortedatum</span>
          <input
            name="birthDate"
            type="date"
            defaultValue={toDateInput(initial?.birthDate)}
            className={inputClass}
          />
        </label>
        <label className="text-sm">
          <span className="block font-medium text-zinc-700">Voorkeurspositie</span>
          <select
            name="preferredPosition"
            defaultValue={initial?.preferredPosition ?? "CM"}
            className={inputClass}
          >
            {POSITION_CODES.map((c) => (
              <option key={c} value={c}>
                {c} — {POSITION_LABELS[c]}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="block font-medium text-zinc-700">Tweede positie (optioneel)</span>
          <select
            name="secondaryPosition"
            defaultValue={initial?.secondaryPosition ?? ""}
            className={inputClass}
          >
            <option value="">—</option>
            {POSITION_CODES.map((c) => (
              <option key={c} value={c}>
                {c} — {POSITION_LABELS[c]}
              </option>
            ))}
          </select>
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

      <label className="flex items-center gap-2 text-sm font-medium text-zinc-700">
        <input
          name="active"
          type="checkbox"
          defaultChecked={initial?.active ?? true}
          className="h-4 w-4"
        />
        Actief in selectie
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
