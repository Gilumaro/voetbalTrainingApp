"use client";

import { useTransition } from "react";

interface Props {
  sessionId: number;
  deleteAction: (id: number) => Promise<void>;
}

export default function DeleteSessionButton({ sessionId, deleteAction }: Props) {
  const [pending, startTransition] = useTransition();

  function handleClick() {
    if (!window.confirm("Training verwijderen?")) return;
    startTransition(() => deleteAction(sessionId));
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className="rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-500 transition hover:border-red-300 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
    >
      {pending ? "…" : "Verwijder"}
    </button>
  );
}
