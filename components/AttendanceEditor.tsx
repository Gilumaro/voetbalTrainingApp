"use client";

import { useState } from "react";

export type AttendancePlayer = {
  playerId: number;
  name: string;
  shirtNumber: number | null;
  present: boolean;
  didCleanup: boolean;
};

/**
 * Squad roster with present / cleanup toggles. Keeps state client-side and serialises
 * it to a hidden JSON input on submit, mirroring how DrillForm posts its aids.
 */
export default function AttendanceEditor({
  sessionId,
  players,
  action,
}: {
  sessionId: number;
  players: AttendancePlayer[];
  action: (sessionId: number, formData: FormData) => void | Promise<void>;
}) {
  const [rows, setRows] = useState<AttendancePlayer[]>(players);
  const bound = action.bind(null, sessionId);

  function toggle(playerId: number, field: "present" | "didCleanup") {
    setRows((prev) =>
      prev.map((r) => {
        if (r.playerId !== playerId) return r;
        if (field === "present") {
          const present = !r.present;
          return { ...r, present, didCleanup: present ? r.didCleanup : false };
        }
        return { ...r, [field]: !r[field] };
      }),
    );
  }

  const presentCount = rows.filter((r) => r.present).length;
  const cleanupCount = rows.filter((r) => r.didCleanup).length;

  return (
    <form action={bound} className="space-y-4">
      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 text-left text-zinc-600">
            <tr>
              <th className="px-4 py-2 font-medium">Speler</th>
              <th className="px-4 py-2 text-center font-medium">Aanwezig</th>
              <th className="px-4 py-2 text-center font-medium">Opgeruimd</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.playerId} className="border-t border-zinc-100">
                <td className="px-4 py-2 text-zinc-800">
                  {r.shirtNumber != null && (
                    <span className="mr-2 inline-block w-6 text-zinc-400">
                      {r.shirtNumber}
                    </span>
                  )}
                  {r.name}
                </td>
                <td className="px-4 py-2 text-center">
                  <input
                    type="checkbox"
                    checked={r.present}
                    onChange={() => toggle(r.playerId, "present")}
                    className="h-4 w-4"
                  />
                </td>
                <td className="px-4 py-2 text-center">
                  <input
                    type="checkbox"
                    checked={r.didCleanup}
                    onChange={() => toggle(r.playerId, "didCleanup")}
                    disabled={!r.present}
                    className="h-4 w-4 disabled:opacity-30"
                  />
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-zinc-500">
                  Nog geen spelers. Voeg eerst spelers toe aan het team.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="text-sm text-zinc-500">
        {presentCount} aanwezig · {cleanupCount} opgeruimd
      </p>

      <input
        type="hidden"
        name="attendance"
        value={JSON.stringify(
          rows.map((r) => ({
            playerId: r.playerId,
            present: r.present,
            didCleanup: r.didCleanup,
          })),
        )}
      />
      <button
        type="submit"
        className="rounded-lg bg-emerald-600 px-5 py-2.5 font-semibold text-white hover:bg-emerald-700"
      >
        Opslaan
      </button>
    </form>
  );
}
