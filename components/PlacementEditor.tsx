"use client";

import { useState } from "react";
import PitchDiagram, { type DiagramAid } from "./PitchDiagram";
import { AID_TYPES, AID_TYPE_LABELS, type AidType } from "@/lib/enums";

/** Nudge the aid positions of one station's setup (FR-6e), with a live preview. */
export default function PlacementEditor({
  footprintX,
  footprintY,
  initialAids,
  action,
}: {
  footprintX: number;
  footprintY: number;
  initialAids: DiagramAid[];
  action: (formData: FormData) => void | Promise<void>;
}) {
  const [aids, setAids] = useState<DiagramAid[]>(initialAids);

  const update = (i: number, patch: Partial<DiagramAid>) =>
    setAids((prev) => prev.map((a, idx) => (idx === i ? { ...a, ...patch } : a)));
  const add = () =>
    setAids((prev) => [
      ...prev,
      { type: "DISC_CONE", x: Math.round(footprintX / 2), y: Math.round(footprintY / 2) },
    ]);
  const remove = (i: number) => setAids((prev) => prev.filter((_, idx) => idx !== i));

  return (
    <form action={action} className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="rounded-xl border border-zinc-200 bg-white p-3">
        <PitchDiagram footprintX={footprintX || 1} footprintY={footprintY || 1} aids={aids} scale={9} className="w-full" />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-zinc-700">Posities (in meters)</p>
          <button type="button" onClick={add}
            className="rounded-md bg-emerald-600 px-2 py-1 text-xs font-medium text-white hover:bg-emerald-700">
            + toevoegen
          </button>
        </div>
        <div className="space-y-2">
          {aids.map((a, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <select value={a.type} onChange={(e) => update(i, { type: e.target.value as AidType })}
                className="min-w-0 flex-1 rounded border border-zinc-300 px-1.5 py-1 text-xs">
                {AID_TYPES.map((t) => (
                  <option key={t} value={t}>{AID_TYPE_LABELS[t]}</option>
                ))}
              </select>
              <input type="number" value={a.x} step={0.5} title="x (m)"
                onChange={(e) => update(i, { x: Number(e.target.value) })}
                className="w-14 rounded border border-zinc-300 px-1 py-1 text-xs" />
              <input type="number" value={a.y} step={0.5} title="y (m)"
                onChange={(e) => update(i, { y: Number(e.target.value) })}
                className="w-14 rounded border border-zinc-300 px-1 py-1 text-xs" />
              <button type="button" onClick={() => remove(i)}
                className="rounded px-1.5 py-1 text-xs text-red-500 hover:bg-red-50">✕</button>
            </div>
          ))}
        </div>

        <input type="hidden" name="aids" value={JSON.stringify(aids)} />
        <button type="submit"
          className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 font-semibold text-white hover:bg-emerald-700">
          Opstelling opslaan
        </button>
      </div>
    </form>
  );
}
