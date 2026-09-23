"use client";

import { useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";

/**
 * Submit button for server-action forms. Shows a spinner while the action is in
 * flight and briefly confirms "Opgeslagen" after it resolves, for forms that stay
 * on the same page (no redirect) and would otherwise give zero feedback.
 */
export default function SubmitButton({
  children,
  pendingLabel = "Bezig...",
  className = "",
  formAction,
}: {
  children: React.ReactNode;
  pendingLabel?: string;
  className?: string;
  formAction?: (formData: FormData) => void | Promise<void>;
}) {
  const { pending } = useFormStatus();
  const [justSaved, setJustSaved] = useState(false);
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending) {
      setJustSaved(true);
      const t = setTimeout(() => setJustSaved(false), 2000);
      wasPending.current = pending;
      return () => clearTimeout(t);
    }
    wasPending.current = pending;
  }, [pending]);

  return (
    <button
      type="submit"
      formAction={formAction}
      disabled={pending}
      aria-busy={pending}
      className={`inline-flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-70 ${className}`}
    >
      {pending && (
        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
          />
        </svg>
      )}
      {pending ? pendingLabel : justSaved ? "Opgeslagen ✓" : children}
    </button>
  );
}
