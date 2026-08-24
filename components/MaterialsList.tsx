import { AID_TYPE_LABELS, type AidType } from "@/lib/enums";
import {
  MATERIAL_ORDER,
  tallyAids,
  type MaterialTally,
} from "@/lib/materials";

/**
 * Setup checklist: materials to lay out, aggregated by type (FR-6c).
 * Pass either `aids` (tallied here) or a precomputed `tally` (blocks/sessions).
 */
export default function MaterialsList({
  aids,
  tally,
  title = "Benodigd materiaal",
}: {
  aids?: { type: string }[];
  tally?: MaterialTally;
  title?: string;
}) {
  const t = tally ?? tallyAids(aids ?? []);
  const rows = MATERIAL_ORDER.filter((k) => (t[k] ?? 0) > 0);

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 avoid-break">
      <h2 className="text-sm font-semibold text-zinc-700">{title}</h2>
      {rows.length === 0 ? (
        <p className="mt-1 text-xs text-zinc-400">Geen materiaal nodig.</p>
      ) : (
        <ul className="mt-2 space-y-1 text-sm text-zinc-700">
          {rows.map((k) => (
            <li key={k} className="flex justify-between">
              <span>{AID_TYPE_LABELS[k as AidType]}</span>
              <span className="font-semibold tabular-nums">{t[k]}×</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
