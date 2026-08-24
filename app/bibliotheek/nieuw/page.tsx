import Link from "next/link";
import DrillForm from "@/components/DrillForm";
import { createDrill } from "../actions";

export default function NieuweOefeningPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link href="/bibliotheek" className="text-sm text-zinc-500 hover:text-zinc-800">
          ← Terug naar bibliotheek
        </Link>
        <h1 className="mt-1 text-2xl font-semibold text-zinc-900">Nieuwe oefening</h1>
      </div>
      <DrillForm action={createDrill} submitLabel="Oefening aanmaken" />
    </div>
  );
}
