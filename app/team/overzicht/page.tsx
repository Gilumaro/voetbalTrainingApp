import Link from "next/link";
import { getAttendanceOverview } from "@/lib/attendance";

export const dynamic = "force-dynamic";

export default async function OverviewPage() {
  const rows = await getAttendanceOverview();
  const minCleanups = rows.length ? Math.min(...rows.map((r) => r.cleanups)) : 0;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/team" className="text-sm text-zinc-500 hover:text-zinc-800">
          ← Terug naar team
        </Link>
        <h1 className="mt-1 text-2xl font-semibold text-zinc-900">
          Aanwezigheid & opruimen
        </h1>
        <p className="mt-1 text-zinc-600">
          Gesorteerd op minst opgeruimd — handig om de volgende opruimbeurt eerlijk te
          verdelen.
        </p>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-xl border border-dashed border-zinc-300 bg-white p-8 text-center text-zinc-500">
          Nog geen spelers of trainingen.
        </p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-left text-zinc-600">
              <tr>
                <th className="px-4 py-2 font-medium">Speler</th>
                <th className="px-4 py-2 text-center font-medium">Aanwezig</th>
                <th className="px-4 py-2 text-center font-medium">Afwezig training</th>
                <th className="px-4 py-2 text-center font-medium">Afwezig wedstrijd</th>
                <th className="px-4 py-2 text-center font-medium">Opgeruimd</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.playerId}
                  className={
                    "border-t border-zinc-100 " +
                    (r.cleanups === minCleanups ? "bg-amber-50" : "")
                  }
                >
                  <td className="px-4 py-2">
                    <Link
                      href={`/team/${r.playerId}`}
                      className="font-medium text-emerald-700 hover:underline"
                    >
                      {r.name}
                    </Link>
                    {!r.active && (
                      <span className="ml-2 text-xs text-zinc-400">(inactief)</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-center text-zinc-700">{r.present}</td>
                  <td className="px-4 py-2 text-center text-zinc-700">{r.absentTraining}</td>
                  <td className="px-4 py-2 text-center text-zinc-700">{r.absentMatch}</td>
                  <td className="px-4 py-2 text-center font-semibold text-zinc-800">
                    {r.cleanups}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-xs text-zinc-400">
        Spelers met de minste opruimbeurten zijn geel gemarkeerd.
      </p>
    </div>
  );
}
