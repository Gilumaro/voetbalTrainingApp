import type { PositionCode } from "./enums";

// Formations as pure data (no DB). A slot's x/y are fractions 0..1 of the pitch:
// x = 0 (left) → 1 (right); y = 0 (opponent goal, top of the SVG) → 1 (own keeper,
// bottom). The lineup builder converts these to metres against the pitch footprint,
// mirroring the metres→coords idea used by PitchDiagram.
export type FormationSlot = {
  code: PositionCode;
  x: number;
  y: number;
};

export type Formation = {
  key: string;
  label: string;
  slots: FormationSlot[];
};

// Shared y-bands (0 = attack/top, 1 = own keeper/bottom).
const GK = 0.95;
const DEF = 0.8; // back four/three line
const WB = 0.73; // wing-backs sit a touch higher
const DM_Y = 0.62;
const MID = 0.53;
const AM_Y = 0.4;
const WING = 0.24;
const ST_Y = 0.19;

// Common x-spreads.
const back4: [PositionCode, number][] = [
  ["LB", 0.15],
  ["LCB", 0.38],
  ["RCB", 0.62],
  ["RB", 0.85],
];
const back3: [PositionCode, number][] = [
  ["LCB", 0.28],
  ["CB", 0.5],
  ["RCB", 0.72],
];
const back5: [PositionCode, [number, number]][] = [
  ["LWB", [0.1, WB]],
  ["LCB", [0.3, DEF]],
  ["CB", [0.5, DEF + 0.02]],
  ["RCB", [0.7, DEF]],
  ["RWB", [0.9, WB]],
];

function line(defs: [PositionCode, number][], y: number): FormationSlot[] {
  return defs.map(([code, x]) => ({ code, x, y }));
}

const keeper: FormationSlot = { code: "GK", x: 0.5, y: GK };
const defLine4 = line(back4, DEF);
const defLine3 = line(back3, DEF);
const defLine5: FormationSlot[] = back5.map(([code, [x, y]]) => ({ code, x, y }));

// The 11 slots always lead with the keeper; order is otherwise back-to-front.
const FORMATION_LIST: Formation[] = [
  // ---- Back four ----------------------------------------------------------
  {
    key: "4-3-3",
    label: "4-3-3",
    slots: [
      keeper,
      ...defLine4,
      { code: "DM", x: 0.5, y: DM_Y },
      { code: "CM", x: 0.28, y: MID },
      { code: "CM", x: 0.72, y: MID },
      { code: "LW", x: 0.18, y: WING },
      { code: "ST", x: 0.5, y: ST_Y },
      { code: "RW", x: 0.82, y: WING },
    ],
  },
  {
    key: "4-4-2",
    label: "4-4-2 (plat)",
    slots: [
      keeper,
      ...defLine4,
      { code: "LM", x: 0.15, y: MID },
      { code: "CM", x: 0.4, y: MID + 0.02 },
      { code: "CM", x: 0.6, y: MID + 0.02 },
      { code: "RM", x: 0.85, y: MID },
      { code: "ST", x: 0.38, y: ST_Y + 0.01 },
      { code: "ST", x: 0.62, y: ST_Y + 0.01 },
    ],
  },
  {
    key: "4-4-2 (ruit)",
    label: "4-4-2 (ruit / diamond)",
    slots: [
      keeper,
      ...defLine4,
      { code: "DM", x: 0.5, y: DM_Y + 0.02 },
      { code: "CM", x: 0.27, y: MID },
      { code: "CM", x: 0.73, y: MID },
      { code: "AM", x: 0.5, y: AM_Y },
      { code: "ST", x: 0.38, y: ST_Y + 0.01 },
      { code: "ST", x: 0.62, y: ST_Y + 0.01 },
    ],
  },
  {
    key: "4-2-3-1",
    label: "4-2-3-1",
    slots: [
      keeper,
      ...defLine4,
      { code: "DM", x: 0.35, y: DM_Y },
      { code: "DM", x: 0.65, y: DM_Y },
      { code: "LW", x: 0.18, y: AM_Y - 0.02 },
      { code: "AM", x: 0.5, y: AM_Y },
      { code: "RW", x: 0.82, y: AM_Y - 0.02 },
      { code: "ST", x: 0.5, y: ST_Y },
    ],
  },
  {
    key: "4-1-4-1",
    label: "4-1-4-1",
    slots: [
      keeper,
      ...defLine4,
      { code: "DM", x: 0.5, y: DM_Y },
      { code: "LM", x: 0.15, y: MID - 0.03 },
      { code: "CM", x: 0.4, y: MID },
      { code: "CM", x: 0.6, y: MID },
      { code: "RM", x: 0.85, y: MID - 0.03 },
      { code: "ST", x: 0.5, y: ST_Y + 0.01 },
    ],
  },
  {
    key: "4-1-3-2",
    label: "4-1-3-2",
    slots: [
      keeper,
      ...defLine4,
      { code: "DM", x: 0.5, y: DM_Y },
      { code: "LM", x: 0.18, y: MID - 0.03 },
      { code: "CM", x: 0.5, y: MID - 0.03 },
      { code: "RM", x: 0.82, y: MID - 0.03 },
      { code: "ST", x: 0.38, y: ST_Y + 0.02 },
      { code: "ST", x: 0.62, y: ST_Y + 0.02 },
    ],
  },
  {
    key: "4-3-2-1",
    label: "4-3-2-1 (kerstboom)",
    slots: [
      keeper,
      ...defLine4,
      { code: "CM", x: 0.28, y: DM_Y - 0.02 },
      { code: "CM", x: 0.5, y: DM_Y },
      { code: "CM", x: 0.72, y: DM_Y - 0.02 },
      { code: "AM", x: 0.36, y: AM_Y },
      { code: "AM", x: 0.64, y: AM_Y },
      { code: "ST", x: 0.5, y: ST_Y },
    ],
  },
  {
    key: "4-4-1-1",
    label: "4-4-1-1",
    slots: [
      keeper,
      ...defLine4,
      { code: "LM", x: 0.15, y: MID },
      { code: "CM", x: 0.4, y: MID + 0.02 },
      { code: "CM", x: 0.6, y: MID + 0.02 },
      { code: "RM", x: 0.85, y: MID },
      { code: "AM", x: 0.5, y: AM_Y - 0.02 },
      { code: "ST", x: 0.5, y: ST_Y },
    ],
  },
  {
    key: "4-2-2-2",
    label: "4-2-2-2",
    slots: [
      keeper,
      ...defLine4,
      { code: "DM", x: 0.35, y: DM_Y },
      { code: "DM", x: 0.65, y: DM_Y },
      { code: "AM", x: 0.3, y: AM_Y },
      { code: "AM", x: 0.7, y: AM_Y },
      { code: "ST", x: 0.38, y: ST_Y + 0.01 },
      { code: "ST", x: 0.62, y: ST_Y + 0.01 },
    ],
  },
  {
    key: "4-5-1",
    label: "4-5-1",
    slots: [
      keeper,
      ...defLine4,
      { code: "LM", x: 0.12, y: MID - 0.01 },
      { code: "CM", x: 0.35, y: MID + 0.02 },
      { code: "CM", x: 0.65, y: MID + 0.02 },
      { code: "RM", x: 0.88, y: MID - 0.01 },
      { code: "AM", x: 0.5, y: AM_Y + 0.02 },
      { code: "ST", x: 0.5, y: ST_Y + 0.01 },
    ],
  },
  {
    key: "4-2-4",
    label: "4-2-4",
    slots: [
      keeper,
      ...defLine4,
      { code: "CM", x: 0.35, y: MID + 0.02 },
      { code: "CM", x: 0.65, y: MID + 0.02 },
      { code: "LW", x: 0.14, y: WING },
      { code: "ST", x: 0.38, y: ST_Y },
      { code: "ST", x: 0.62, y: ST_Y },
      { code: "RW", x: 0.86, y: WING },
    ],
  },
  // ---- Back three ---------------------------------------------------------
  {
    key: "3-4-3",
    label: "3-4-3",
    slots: [
      keeper,
      ...defLine3,
      { code: "LM", x: 0.12, y: MID + 0.02 },
      { code: "CM", x: 0.38, y: MID + 0.02 },
      { code: "CM", x: 0.62, y: MID + 0.02 },
      { code: "RM", x: 0.88, y: MID + 0.02 },
      { code: "LW", x: 0.2, y: WING - 0.02 },
      { code: "ST", x: 0.5, y: ST_Y },
      { code: "RW", x: 0.8, y: WING - 0.02 },
    ],
  },
  {
    key: "3-5-2",
    label: "3-5-2",
    slots: [
      keeper,
      ...defLine3,
      { code: "LWB", x: 0.1, y: MID },
      { code: "CM", x: 0.32, y: MID + 0.02 },
      { code: "CM", x: 0.5, y: MID - 0.01 },
      { code: "CM", x: 0.68, y: MID + 0.02 },
      { code: "RWB", x: 0.9, y: MID },
      { code: "ST", x: 0.38, y: ST_Y + 0.01 },
      { code: "ST", x: 0.62, y: ST_Y + 0.01 },
    ],
  },
  {
    key: "3-4-2-1",
    label: "3-4-2-1",
    slots: [
      keeper,
      ...defLine3,
      { code: "LWB", x: 0.12, y: MID + 0.02 },
      { code: "CM", x: 0.38, y: MID + 0.02 },
      { code: "CM", x: 0.62, y: MID + 0.02 },
      { code: "RWB", x: 0.88, y: MID + 0.02 },
      { code: "AM", x: 0.34, y: AM_Y - 0.04 },
      { code: "AM", x: 0.66, y: AM_Y - 0.04 },
      { code: "ST", x: 0.5, y: ST_Y },
    ],
  },
  {
    key: "3-4-1-2",
    label: "3-4-1-2",
    slots: [
      keeper,
      ...defLine3,
      { code: "LWB", x: 0.12, y: MID + 0.02 },
      { code: "CM", x: 0.38, y: MID + 0.02 },
      { code: "CM", x: 0.62, y: MID + 0.02 },
      { code: "RWB", x: 0.88, y: MID + 0.02 },
      { code: "AM", x: 0.5, y: AM_Y },
      { code: "ST", x: 0.38, y: ST_Y + 0.01 },
      { code: "ST", x: 0.62, y: ST_Y + 0.01 },
    ],
  },
  {
    key: "3-6-1",
    label: "3-6-1",
    slots: [
      keeper,
      ...defLine3,
      { code: "LWB", x: 0.1, y: MID + 0.03 },
      { code: "RWB", x: 0.9, y: MID + 0.03 },
      { code: "CM", x: 0.3, y: MID + 0.01 },
      { code: "CM", x: 0.5, y: MID + 0.03 },
      { code: "CM", x: 0.7, y: MID + 0.01 },
      { code: "AM", x: 0.5, y: AM_Y },
      { code: "ST", x: 0.5, y: ST_Y + 0.01 },
    ],
  },
  {
    key: "3-3-1-3",
    label: "3-3-1-3",
    slots: [
      keeper,
      ...defLine3,
      { code: "CM", x: 0.28, y: MID + 0.03 },
      { code: "CM", x: 0.5, y: MID + 0.05 },
      { code: "CM", x: 0.72, y: MID + 0.03 },
      { code: "AM", x: 0.5, y: AM_Y },
      { code: "LW", x: 0.18, y: WING - 0.02 },
      { code: "ST", x: 0.5, y: ST_Y },
      { code: "RW", x: 0.82, y: WING - 0.02 },
    ],
  },
  {
    key: "3-2-4-1",
    label: "3-2-4-1",
    slots: [
      keeper,
      ...defLine3,
      { code: "DM", x: 0.36, y: DM_Y + 0.02 },
      { code: "DM", x: 0.64, y: DM_Y + 0.02 },
      { code: "LM", x: 0.14, y: AM_Y + 0.04 },
      { code: "AM", x: 0.4, y: AM_Y + 0.02 },
      { code: "AM", x: 0.6, y: AM_Y + 0.02 },
      { code: "RM", x: 0.86, y: AM_Y + 0.04 },
      { code: "ST", x: 0.5, y: ST_Y + 0.01 },
    ],
  },
  // ---- Back five ----------------------------------------------------------
  {
    key: "5-3-2",
    label: "5-3-2",
    slots: [
      keeper,
      ...defLine5,
      { code: "CM", x: 0.28, y: MID },
      { code: "CM", x: 0.5, y: MID - 0.02 },
      { code: "CM", x: 0.72, y: MID },
      { code: "ST", x: 0.38, y: ST_Y + 0.01 },
      { code: "ST", x: 0.62, y: ST_Y + 0.01 },
    ],
  },
  {
    key: "5-4-1",
    label: "5-4-1",
    slots: [
      keeper,
      ...defLine5,
      { code: "LM", x: 0.18, y: MID },
      { code: "CM", x: 0.4, y: MID + 0.02 },
      { code: "CM", x: 0.6, y: MID + 0.02 },
      { code: "RM", x: 0.82, y: MID },
      { code: "ST", x: 0.5, y: ST_Y + 0.01 },
    ],
  },
  {
    key: "5-2-1-2",
    label: "5-2-1-2",
    slots: [
      keeper,
      ...defLine5,
      { code: "CM", x: 0.38, y: MID + 0.02 },
      { code: "CM", x: 0.62, y: MID + 0.02 },
      { code: "AM", x: 0.5, y: AM_Y },
      { code: "ST", x: 0.38, y: ST_Y + 0.01 },
      { code: "ST", x: 0.62, y: ST_Y + 0.01 },
    ],
  },
  {
    key: "5-2-3",
    label: "5-2-3",
    slots: [
      keeper,
      ...defLine5,
      { code: "CM", x: 0.38, y: MID + 0.02 },
      { code: "CM", x: 0.62, y: MID + 0.02 },
      { code: "LW", x: 0.18, y: WING },
      { code: "ST", x: 0.5, y: ST_Y },
      { code: "RW", x: 0.82, y: WING },
    ],
  },
  // ---- Historic / unconventional -----------------------------------------
  {
    key: "2-3-5",
    label: "2-3-5 (piramide)",
    slots: [
      keeper,
      { code: "LCB", x: 0.35, y: DEF },
      { code: "RCB", x: 0.65, y: DEF },
      { code: "LM", x: 0.25, y: MID + 0.02 },
      { code: "CM", x: 0.5, y: MID + 0.04 },
      { code: "RM", x: 0.75, y: MID + 0.02 },
      { code: "LW", x: 0.1, y: WING + 0.02 },
      { code: "AM", x: 0.3, y: AM_Y - 0.06 },
      { code: "ST", x: 0.5, y: ST_Y },
      { code: "AM", x: 0.7, y: AM_Y - 0.06 },
      { code: "RW", x: 0.9, y: WING + 0.02 },
    ],
  },
  {
    key: "3-2-5",
    label: "3-2-5 (W-M)",
    slots: [
      keeper,
      ...defLine3,
      { code: "CM", x: 0.38, y: DM_Y - 0.02 },
      { code: "CM", x: 0.62, y: DM_Y - 0.02 },
      { code: "LW", x: 0.1, y: WING + 0.02 },
      { code: "AM", x: 0.3, y: AM_Y - 0.04 },
      { code: "ST", x: 0.5, y: ST_Y },
      { code: "AM", x: 0.7, y: AM_Y - 0.04 },
      { code: "RW", x: 0.9, y: WING + 0.02 },
    ],
  },
  {
    key: "2-3-2-3",
    label: "2-3-2-3 (Metodo)",
    slots: [
      keeper,
      { code: "LCB", x: 0.35, y: DEF },
      { code: "RCB", x: 0.65, y: DEF },
      { code: "LM", x: 0.25, y: DM_Y - 0.02 },
      { code: "CM", x: 0.5, y: DM_Y },
      { code: "RM", x: 0.75, y: DM_Y - 0.02 },
      { code: "AM", x: 0.36, y: AM_Y + 0.02 },
      { code: "AM", x: 0.64, y: AM_Y + 0.02 },
      { code: "LW", x: 0.18, y: WING - 0.02 },
      { code: "ST", x: 0.5, y: ST_Y },
      { code: "RW", x: 0.82, y: WING - 0.02 },
    ],
  },
];

export const FORMATIONS: Record<string, Formation> = Object.fromEntries(
  FORMATION_LIST.map((f) => [f.key, f]),
);

export const FORMATION_KEYS = FORMATION_LIST.map((f) => f.key);

export const DEFAULT_FORMATION = "4-3-3";

export function getFormation(key: string): Formation {
  return FORMATIONS[key] ?? FORMATIONS[DEFAULT_FORMATION];
}
