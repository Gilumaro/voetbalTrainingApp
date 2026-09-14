"use client";

import { useState } from "react";
import Link from "next/link";
import { THEME_LABELS, type Theme } from "@/lib/enums";
import DeleteSessionButton from "./DeleteSessionButton";

export type SessionRow = {
  id: number;
  date: string; // ISO string
  label: string | null;
  theme: string;
  durationMin: number;
  players: number;
  blocks: { id: number }[];
};

interface Props {
  sessions: SessionRow[];
  deleteAction: (id: number) => Promise<void>;
}

export default function SessionList({ sessions, deleteAction }: Props) {
  const [showPast, setShowPast] = useState(false);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const past = sessions.filter((s) => new Date(s.date) < today);
  const upcoming = sessions.filter((s) => new Date(s.date) >= today);
  const visible = showPast ? sessions : upcoming;

  if (sessions.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-zinc-300 bg-white p-8 text-center text-zinc-500">
        Nog geen trainingen opgeslagen. Genereer een seizoen of klik op "+ Nieuwe genereren".
      </p>
    );
  }

  if (visible.length === 0 && !showPast) {
    return (
      <div className="space-y-3">
        <p className="rounded-xl border border-dashed border-zinc-300 bg-white p-8 text-center text-zinc-500">
          Geen aankomende trainingen. Genereer een seizoen of bekijk verleden trainingen.
        </p>
        {past.length > 0 && (
          <button
            onClick={() => setShowPast(true)}
            className="text-sm text-zinc-500 hover:text-zinc-800 underline underline-offset-2"
          >
            Toon {past.length} verleden training{past.length !== 1 ? "en" : ""}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {past.length > 0 && (
        <button
          onClick={() => setShowPast((v) => !v)}
          className="text-sm text-zinc-500 hover:text-zinc-800 underline underline-offset-2"
        >
          {showPast
            ? "Verberg verleden trainingen"
            : `Toon ${past.length} verleden training${past.length !== 1 ? "en" : ""}`}
        </button>
      )}

      <ul className="space-y-2">
        {visible.map((s) => {
          const isPast = new Date(s.date) < today;
          const isEmpty = s.blocks.length === 0;
          const title =
            s.label ??
            new Date(s.date).toLocaleDateString("nl-NL", {
              weekday: "long",
              day: "numeric",
              month: "long",
            });
          const dateLabel = new Date(s.date).toLocaleDateString("nl-NL", {
            weekday: "short",
            day: "numeric",
            month: "long",
          });

          return (
            <li key={s.id} className={`flex items-center gap-2 ${isPast ? "opacity-60" : ""}`}>
              <Link
                href={`/trainingen/${s.id}`}
                className="flex flex-1 items-center justify-between rounded-xl border border-zinc-200 bg-white px-5 py-4 transition hover:border-emerald-300 hover:shadow"
              >
                <div>
                  <p className="font-semibold text-zinc-900">{title}</p>
                  <p className="mt-0.5 text-sm text-zinc-500">
                    {isEmpty ? (
                      <span className="inline-flex items-center rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-500">
                        Leeg
                      </span>
                    ) : (
                      <>
                        {THEME_LABELS[s.theme as Theme]} · {s.durationMin} min · {s.players} spelers · {s.blocks.length} blokken
                      </>
                    )}
                  </p>
                </div>
                <span className="text-sm text-zinc-400">{dateLabel}</span>
              </Link>
              <DeleteSessionButton sessionId={s.id} deleteAction={deleteAction} />
            </li>
          );
        })}
      </ul>

    </div>
  );
}
