import { AidGlyph, type DiagramAid } from "./PitchDiagram";

export type StationShape = {
  footprintX: number;
  footprintY: number;
  aids: DiagramAid[];
  label?: string;
};

/**
 * Fit a station's footprint into an available WxH box, rotating 90° (CCW) when the
 * natural orientation doesn't fit but the rotated one does. Aid coordinates are
 * transformed to match: (x, y) → (y, fx - x).
 */
function orient(
  station: StationShape,
  availW: number,
  availH: number,
): { fx: number; fy: number; aids: DiagramAid[] } {
  const { footprintX: fx, footprintY: fy, aids } = station;
  const e = 0.01;
  const naturalFits = fx <= availW + e && fy <= availH + e;
  const rotatedFits = fy <= availW + e && fx <= availH + e;
  if (naturalFits || !rotatedFits) return { fx, fy, aids };
  return {
    fx: fy,
    fy: fx,
    aids: aids.map((a) => ({ ...a, x: a.y, y: fx - a.x })),
  };
}

/**
 * Renders TWO stations side-by-side on one half-pitch (FR-6b), so the coach can see
 * both setups fit and where every goal/cone goes. Each footprint is centred in its
 * half of the available space.
 */
export default function CombinedPitchDiagram({
  availX,
  availY,
  left,
  right,
  scale = 6,
  className,
}: {
  availX: number;
  availY: number;
  left?: StationShape | null;
  right?: StationShape | null;
  scale?: number;
  className?: string;
}) {
  const pad = 14;
  const w = availX * scale + pad * 2;
  const h = availY * scale + pad * 2;
  const halfW = availX / 2;

  function renderStation(station: StationShape, offsetXm: number, tint: string) {
    // Orient the footprint so it fits within its half (rotate 90° if needed),
    // so the two stations never overlap on the pitch.
    const { fx, fy, aids } = orient(station, halfW, availY);
    const ox = offsetXm + Math.max(0, (halfW - fx) / 2);
    const oy = Math.max(0, (availY - fy) / 2);
    const mx = (x: number) => pad + (ox + x) * scale;
    const my = (y: number) => pad + (oy + y) * scale;
    return (
      <g>
        <rect
          x={pad + ox * scale}
          y={pad + oy * scale}
          width={fx * scale}
          height={fy * scale}
          fill={tint}
          fillOpacity={0.08}
          stroke="#64748b"
          strokeDasharray="4 3"
          rx={3}
        />
        {aids.map((a, i) => (
          <AidGlyph key={i} aid={a} cx={mx(a.x)} cy={my(a.y)} scale={scale} fx={fx} fy={fy} />
        ))}
      </g>
    );
  }

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className={className}
      role="img"
      aria-label="Gecombineerde veldopstelling (twee stations)"
      preserveAspectRatio="xMidYMid meet"
    >
      <rect
        x={pad}
        y={pad}
        width={availX * scale}
        height={availY * scale}
        fill="#15803d"
        fillOpacity={0.1}
        stroke="#15803d"
        strokeOpacity={0.55}
        strokeWidth={1.5}
        rx={4}
      />
      {/* dividing line between the two halves */}
      <line
        x1={pad + halfW * scale}
        y1={pad}
        x2={pad + halfW * scale}
        y2={pad + availY * scale}
        stroke="#15803d"
        strokeOpacity={0.35}
        strokeDasharray="6 4"
      />
      {left && renderStation(left, 0, "#2563eb")}
      {right && renderStation(right, halfW, "#f97316")}
    </svg>
  );
}
