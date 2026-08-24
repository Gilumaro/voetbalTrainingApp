export type DiagramAid = {
  type: string; // AidType value; kept as string since it comes from the DB
  x: number; // metres from left edge of the footprint
  y: number; // metres from top edge of the footprint
  rotation?: number;
  label?: string | null;
};

const GOAL_WIDTH_M: Record<string, number> = { BIG_GOAL: 7, SMALL_GOAL: 3 };

/**
 * Top-down SVG diagram of a single drill's footprint with its aids placed on it.
 * Pure/presentational so it renders both server-side (list, print) and inside the
 * client editor's live preview.
 */
export default function PitchDiagram({
  footprintX,
  footprintY,
  aids,
  scale = 6,
  className,
  label,
}: {
  footprintX: number;
  footprintY: number;
  aids: DiagramAid[];
  scale?: number;
  className?: string;
  label?: string;
}) {
  const pad = 14;
  const w = footprintX * scale + pad * 2;
  const h = footprintY * scale + pad * 2;
  const mx = (x: number) => pad + x * scale;
  const my = (y: number) => pad + y * scale;

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className={className}
      role="img"
      aria-label={label ?? "Veldopstelling"}
      preserveAspectRatio="xMidYMid meet"
    >
      <rect
        x={pad}
        y={pad}
        width={footprintX * scale}
        height={footprintY * scale}
        fill="#15803d"
        fillOpacity={0.1}
        stroke="#15803d"
        strokeOpacity={0.55}
        strokeWidth={1.5}
        rx={4}
      />
      <line
        x1={pad}
        y1={my(footprintY / 2)}
        x2={pad + footprintX * scale}
        y2={my(footprintY / 2)}
        stroke="#15803d"
        strokeOpacity={0.3}
        strokeDasharray="5 5"
      />
      {aids.map((a, i) => (
        <AidGlyph
          key={i}
          aid={a}
          cx={mx(a.x)}
          cy={my(a.y)}
          scale={scale}
          fx={footprintX}
          fy={footprintY}
        />
      ))}
    </svg>
  );
}

export function AidGlyph({
  aid,
  cx,
  cy,
  scale,
  fx,
  fy,
}: {
  aid: DiagramAid;
  cx: number;
  cy: number;
  scale: number;
  fx: number;
  fy: number;
}) {
  switch (aid.type) {
    case "BIG_GOAL":
    case "SMALL_GOAL": {
      const half = (GOAL_WIDTH_M[aid.type] * scale) / 2;
      // Orient the goal along whichever edge it sits closest to.
      const nearTopBottom =
        Math.min(aid.y, fy - aid.y) <= Math.min(aid.x, fx - aid.x);
      return nearTopBottom ? (
        <rect
          x={cx - half}
          y={cy - 3}
          width={half * 2}
          height={6}
          fill="#ffffff"
          stroke="#0f172a"
          strokeWidth={1.5}
        />
      ) : (
        <rect
          x={cx - 3}
          y={cy - half}
          width={6}
          height={half * 2}
          fill="#ffffff"
          stroke="#0f172a"
          strokeWidth={1.5}
        />
      );
    }
    case "DISC_CONE":
      return <circle cx={cx} cy={cy} r={4} fill="#facc15" stroke="#a16207" strokeWidth={1} />;
    case "CONE":
      return (
        <polygon
          points={`${cx},${cy - 5} ${cx - 4},${cy + 4} ${cx + 4},${cy + 4}`}
          fill="#f97316"
          stroke="#9a3412"
          strokeWidth={1}
        />
      );
    case "PLAYER":
      return <circle cx={cx} cy={cy} r={5} fill="#2563eb" stroke="#ffffff" strokeWidth={1.5} />;
    case "BALL":
      return <circle cx={cx} cy={cy} r={4} fill="#ffffff" stroke="#0f172a" strokeWidth={1.5} />;
    case "MARKER":
    default:
      return (
        <g stroke="#7c3aed" strokeWidth={2}>
          <line x1={cx - 4} y1={cy - 4} x2={cx + 4} y2={cy + 4} />
          <line x1={cx - 4} y1={cy + 4} x2={cx + 4} y2={cy - 4} />
        </g>
      );
  }
}
