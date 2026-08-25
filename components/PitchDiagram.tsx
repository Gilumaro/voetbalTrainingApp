export type DiagramAid = {
  type: string; // AidType value; kept as string since it comes from the DB
  x: number; // metres from left edge of the footprint
  y: number; // metres from top edge of the footprint
  rotation?: number;
  label?: string | null;
};

export type DiagramAction = {
  kind: string; // ActionKind value (PASS | RUN | DRIBBLE | SHOT | CARRY)
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  label?: string | null;
};

const GOAL_WIDTH_M: Record<string, number> = { BIG_GOAL: 7, SMALL_GOAL: 3 };

// Line colour/style per action kind. Drawn in pixel space.
const ACTION_STYLE: Record<
  string,
  { color: string; width: number; dash?: string; wavy?: boolean; double?: boolean }
> = {
  PASS: { color: "#0f172a", width: 2 },
  RUN: { color: "#0f172a", width: 2, dash: "6 4" },
  DRIBBLE: { color: "#0f172a", width: 2, wavy: true },
  CARRY: { color: "#0f172a", width: 2, double: true },
  SHOT: { color: "#dc2626", width: 2.6 },
};

/**
 * Top-down SVG diagram of a single drill's footprint with its aids placed on it and
 * its actions drawn as arrows (pass/run/dribble/shot). Pure/presentational so it
 * renders server-side (list, print) and inside the client editor's live preview.
 */
export default function PitchDiagram({
  footprintX,
  footprintY,
  aids,
  actions = [],
  scale = 6,
  className,
  label,
}: {
  footprintX: number;
  footprintY: number;
  aids: DiagramAid[];
  actions?: DiagramAction[];
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
      {/* Actions drawn under the glyphs so cones/players sit on top of the lines. */}
      {actions.map((a, i) => (
        <ActionArrow
          key={`act-${i}`}
          action={a}
          x1={mx(a.fromX)}
          y1={my(a.fromY)}
          x2={mx(a.toX)}
          y2={my(a.toY)}
        />
      ))}
      {orderAids(aids).map(({ aid: a, i }) => (
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

// Draw non-player aids first, then players, so player letters stay on top of cones.
export function orderAids(aids: DiagramAid[]): { aid: DiagramAid; i: number }[] {
  const indexed = aids.map((aid, i) => ({ aid, i }));
  const players = indexed.filter((x) => isPlayerAid(x.aid.type));
  const rest = indexed.filter((x) => !isPlayerAid(x.aid.type));
  return [...rest, ...players];
}

export function isPlayerAid(type: string): boolean {
  return type === "PLAYER" || type === "PLAYER_OPP";
}

/**
 * Draw one action as a line (styled per kind) with a computed arrowhead. Arrowheads
 * are drawn as polygons (not SVG markers) so multiple diagrams on one page never
 * collide on marker ids, and it works in server rendering.
 */
export function ActionArrow({
  action,
  x1,
  y1,
  x2,
  y2,
}: {
  action: DiagramAction;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}) {
  const style = ACTION_STYLE[action.kind] ?? ACTION_STYLE.PASS;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  // Stop the line just short of the tip so the arrowhead reads cleanly.
  const head = 8;
  const ex = x2 - ux * head * 0.7;
  const ey = y2 - uy * head * 0.7;

  // Arrowhead polygon.
  const px = -uy; // perpendicular
  const py = ux;
  const hw = head * 0.5;
  const head1x = x2 - ux * head + px * hw;
  const head1y = y2 - uy * head + py * hw;
  const head2x = x2 - ux * head - px * hw;
  const head2y = y2 - uy * head - py * hw;

  const midLabel = action.label
    ? { x: (x1 + x2) / 2 + px * 8, y: (y1 + y2) / 2 + py * 8 }
    : null;

  return (
    <g>
      {style.wavy ? (
        <path
          d={wavyPath(x1, y1, ex, ey)}
          fill="none"
          stroke={style.color}
          strokeWidth={style.width}
        />
      ) : style.double ? (
        <>
          <line
            x1={x1 + px * 1.6}
            y1={y1 + py * 1.6}
            x2={ex + px * 1.6}
            y2={ey + py * 1.6}
            stroke={style.color}
            strokeWidth={style.width}
          />
          <line
            x1={x1 - px * 1.6}
            y1={y1 - py * 1.6}
            x2={ex - px * 1.6}
            y2={ey - py * 1.6}
            stroke={style.color}
            strokeWidth={style.width}
          />
        </>
      ) : (
        <line
          x1={x1}
          y1={y1}
          x2={ex}
          y2={ey}
          stroke={style.color}
          strokeWidth={style.width}
          strokeDasharray={style.dash}
        />
      )}
      <polygon
        points={`${x2},${y2} ${head1x},${head1y} ${head2x},${head2y}`}
        fill={style.color}
      />
      {midLabel && (
        <text
          x={midLabel.x}
          y={midLabel.y}
          fontSize={9}
          fill={style.color}
          textAnchor="middle"
          dominantBaseline="middle"
        >
          {action.label}
        </text>
      )}
    </g>
  );
}

// Sine-wave path between two points (for dribble lines).
function wavyPath(x1: number, y1: number, x2: number, y2: number): string {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const px = -uy;
  const py = ux;
  const amp = 3;
  const wavelength = 9;
  const n = Math.max(2, Math.round(len / wavelength));
  let d = `M ${x1} ${y1}`;
  for (let i = 1; i <= n; i++) {
    const t = i / n;
    const bx = x1 + dx * t;
    const by = y1 + dy * t;
    const off = amp * (i % 2 === 0 ? 1 : -1);
    // Quadratic control point offset perpendicular to the line.
    const cxT = (i - 0.5) / n;
    const cx = x1 + dx * cxT + px * off;
    const cy = y1 + dy * cxT + py * off;
    d += ` Q ${cx} ${cy} ${bx} ${by}`;
  }
  return d;
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
    case "PLAYER_OPP": {
      const fill = aid.type === "PLAYER_OPP" ? "#ea580c" : "#2563eb";
      return (
        <g>
          <circle cx={cx} cy={cy} r={6.5} fill={fill} stroke="#ffffff" strokeWidth={1.5} />
          {aid.label && (
            <text
              x={cx}
              y={cy}
              fontSize={8}
              fontWeight={700}
              fill="#ffffff"
              textAnchor="middle"
              dominantBaseline="central"
            >
              {aid.label}
            </text>
          )}
        </g>
      );
    }
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
