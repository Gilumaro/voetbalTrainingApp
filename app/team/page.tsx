import Link from "next/link";
import { getPlayers, playerName } from "@/lib/players";
import { POSITION_LABELS, type PositionCode } from "@/lib/enums";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const players = await getPlayers();
  const activeCount = players.filter((p) => p.active).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Team</h1>
          <p className="mt-1 text-zinc-600">{activeCount} actieve spelers</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/team/aanwezigheid"
            className="rounded-lg border border-zinc-300 px-4 py-2.5 font-medium text-zinc-700 hover:bg-zinc-50"
          >
            Aanwezigheid
          </Link>
          <Link
            href="/team/overzicht"
            className="rounded-lg border border-zinc-300 px-4 py-2.5 font-medium text-zinc-700 hover:bg-zinc-50"
          >
            Overzicht
          </Link>
          <Link
            href="/team/nieuw"
            className="rounded-lg bg-emerald-600 px-4 py-2.5 font-semibold text-white hover:bg-emerald-700"
          >
            + Nieuwe speler
          </Link>
        </div>
      </div>

      {players.length === 0 ? (
        <p className="rounded-xl border border-dashed border-zinc-300 bg-white p-8 text-center text-zinc-500">
          Nog geen spelers. Voeg je eerste speler toe.
        </p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-left text-zinc-600">
              <tr>
                <th className="px-4 py-2 font-medium">#</th>
                <th className="px-4 py-2 font-medium">Naam</th>
                <th className="px-4 py-2 font-medium">Voorkeurspositie</th>
                <th className="px-4 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {players.map((p) => (
                <tr key={p.id} className="border-t border-zinc-100 hover:bg-zinc-50">
                  <td className="px-4 py-2 text-zinc-500">{p.shirtNumber ?? "—"}</td>
                  <td className="px-4 py-2">
                    <Link
                      href={`/team/${p.id}`}
                      className="font-medium text-emerald-700 hover:underline"
                    >
                      {playerName(p)}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-zinc-700">
                    {POSITION_LABELS[p.preferredPosition as PositionCode] ??
                      p.preferredPosition}
                  </td>
                  <td className="px-4 py-2">
                    {p.active ? (
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                        Actief
                      </span>
                    ) : (
                      <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-500">
                        Inactief
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
