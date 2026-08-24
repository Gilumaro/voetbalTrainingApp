import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { AGE_GOAL } from "@/lib/enums";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [drillCount, sessionCount] = await Promise.all([
    prisma.drill.count(),
    prisma.session.count(),
  ]);

  return (
    <div className="space-y-8">
      <section className="rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-700 p-8 text-white shadow-sm">
        <p className="text-sm font-medium text-emerald-100">Onder 15 · leerdoel</p>
        <h1 className="mt-1 text-2xl font-semibold">{AGE_GOAL.U15}</h1>
        <p className="mt-3 max-w-xl text-emerald-50">
          Genereer in één klik een complete, KNVB-gerichte training — inclusief
          parallelle oefeningen voor je hele groep en een opstelling van het veld.
        </p>
        <Link
          href="/genereren"
          className="mt-5 inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 font-semibold text-emerald-700 transition hover:bg-emerald-50"
        >
          Genereer training →
        </Link>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <DashboardCard
          href="/bibliotheek"
          title="Oefeningenbibliotheek"
          value={`${drillCount} oefening${drillCount === 1 ? "" : "en"}`}
          description="Beheer je oefeningen, partijvormen en warming-ups."
        />
        <DashboardCard
          href="/trainingen"
          title="Opgeslagen trainingen"
          value={`${sessionCount} training${sessionCount === 1 ? "" : "en"}`}
          description="Bekijk, bewerk en print eerdere trainingen."
        />
      </section>
    </div>
  );
}

function DashboardCard({
  href,
  title,
  value,
  description,
}: {
  href: string;
  title: string;
  value: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:border-emerald-300 hover:shadow"
    >
      <h2 className="text-sm font-medium text-zinc-500">{title}</h2>
      <p className="mt-1 text-2xl font-semibold text-zinc-900">{value}</p>
      <p className="mt-2 text-sm text-zinc-600">{description}</p>
    </Link>
  );
}
