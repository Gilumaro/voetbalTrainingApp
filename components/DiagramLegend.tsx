import type { DiagramAction, DiagramAid } from "./PitchDiagram";
import { ACTION_KIND_LABELS, AID_TYPE_LABELS, type ActionKind, type AidType } from "@/lib/enums";

/**
 * Compact legend showing only the symbols actually used in a drill's diagram, so the
 * coach can read the arrows and glyphs (like the Rinus reference). Pure/presentational.
 */
export default function DiagramLegend({
  aids,
  actions,
  className,
}: {
  aids: DiagramAid[];
  actions: DiagramAction[];
  className?: string;
}) {
  const aidTypes = uniquePreserve(aids.map((a) => a.type)).filter(
    (t) => t in AID_TYPE_LABELS,
  ) as AidType[];
  const actionKinds = uniquePreserve(actions.map((a) => a.kind)).filter(
    (k) => k in ACTION_KIND_LABELS,
  ) as ActionKind[];

  if (aidTypes.length === 0 && actionKinds.length === 0) return null;

  return (
    <div className={`rounded-xl border border-zinc-200 bg-white p-3 ${className ?? ""}`}>
      <p className="mb-2 text-xs font-semibold text-zinc-700">Legenda</p>
      <ul className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs text-zinc-600">
        {actionKinds.map((k) => (
          <li key={k} className="flex items-center gap-2">
            <ActionSwatch kind={k} />
            <span>{ACTION_KIND_LABELS[k]}</span>
          </li>
        ))}
        {aidTypes.map((t) => (
          <li key={t} className="flex items-center gap-2">
            <AidSwatch type={t} />
            <span>{AID_TYPE_LABELS[t]}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function uniquePreserve(xs: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const x of xs) {
    if (!seen.has(x)) {
      seen.add(x);
      out.push(x);
    }
  }
  return out;
}

function ActionSwatch({ kind }: { kind: ActionKind }) {
  const color = kind === "SHOT" ? "#dc2626" : "#0f172a";
  return (
    <svg width={26} height={12} className="shrink-0" aria-hidden>
      {kind === "DRIBBLE" ? (
        <path d="M1 6 Q4 2 7 6 Q10 10 13 6 Q16 2 19 6" fill="none" stroke={color} strokeWidth={1.6} />
      ) : kind === "CARRY" ? (
        <>
          <line x1={1} y1={4} x2={19} y2={4} stroke={color} strokeWidth={1.4} />
          <line x1={1} y1={8} x2={19} y2={8} stroke={color} strokeWidth={1.4} />
        </>
      ) : (
        <line
          x1={1}
          y1={6}
          x2={19}
          y2={6}
          stroke={color}
          strokeWidth={kind === "SHOT" ? 2.4 : 1.6}
          strokeDasharray={kind === "RUN" ? "4 3" : undefined}
        />
      )}
      <polygon points={`25,6 19,3 19,9`} fill={color} />
    </svg>
  );
}

function AidSwatch({ type }: { type: AidType }) {
  const s = 12;
  const c = s / 2;
  switch (type) {
    case "BIG_GOAL":
    case "SMALL_GOAL":
      return (
        <svg width={s} height={s} className="shrink-0" aria-hidden>
          <rect x={1} y={4} width={10} height={4} fill="#fff" stroke="#0f172a" strokeWidth={1.2} />
        </svg>
      );
    case "DISC_CONE":
      return (
        <svg width={s} height={s} className="shrink-0" aria-hidden>
          <circle cx={c} cy={c} r={4} fill="#facc15" stroke="#a16207" />
        </svg>
      );
    case "CONE":
      return (
        <svg width={s} height={s} className="shrink-0" aria-hidden>
          <polygon points={`${c},1 ${c - 4},10 ${c + 4},10`} fill="#f97316" stroke="#9a3412" />
        </svg>
      );
    case "PLAYER":
      return (
        <svg width={s} height={s} className="shrink-0" aria-hidden>
          <circle cx={c} cy={c} r={5} fill="#2563eb" stroke="#fff" strokeWidth={1.2} />
        </svg>
      );
    case "PLAYER_OPP":
      return (
        <svg width={s} height={s} className="shrink-0" aria-hidden>
          <circle cx={c} cy={c} r={5} fill="#ea580c" stroke="#fff" strokeWidth={1.2} />
        </svg>
      );
    case "BALL":
      return (
        <svg width={s} height={s} className="shrink-0" aria-hidden>
          <circle cx={c} cy={c} r={4} fill="#fff" stroke="#0f172a" strokeWidth={1.2} />
        </svg>
      );
    case "MARKER":
    default:
      return (
        <svg width={s} height={s} className="shrink-0" aria-hidden>
          <g stroke="#7c3aed" strokeWidth={1.6}>
            <line x1={2} y1={2} x2={10} y2={10} />
            <line x1={2} y1={10} x2={10} y2={2} />
          </g>
        </svg>
      );
  }
}
