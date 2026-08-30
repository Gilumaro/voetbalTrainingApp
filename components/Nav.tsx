"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/genereren", label: "Genereren" },
  { href: "/bibliotheek", label: "Bibliotheek" },
  { href: "/trainingen", label: "Trainingen" },
  { href: "/team", label: "Team" },
  { href: "/wedstrijden", label: "Wedstrijden" },
  { href: "/instellingen", label: "Instellingen" },
];

export default function Nav() {
  const pathname = usePathname();
  return (
    <header className="no-print border-b border-zinc-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-semibold text-zinc-900">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-emerald-600 text-white">
            ⚽
          </span>
          <span>Trainingsplanner</span>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          {LINKS.map((link) => {
            const active =
              pathname === link.href || pathname.startsWith(link.href + "/");
            return (
              <Link
                key={link.href}
                href={link.href}
                className={
                  "rounded-md px-3 py-2 font-medium transition-colors " +
                  (active
                    ? "bg-emerald-50 text-emerald-700"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900")
                }
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
