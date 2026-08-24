import { z } from "zod";

// SQLite has no native enums, so these string unions are the single source of truth,
// validated with Zod at the app boundary and rendered with the Dutch labels below.

export const DRILL_TYPES = ["WARMUP", "EXERCISE", "MATCHFORM"] as const;
export type DrillType = (typeof DRILL_TYPES)[number];
export const DRILL_TYPE_LABELS: Record<DrillType, string> = {
  WARMUP: "Warming-up",
  EXERCISE: "Oefenvorm",
  MATCHFORM: "Partijvorm",
};

export const THEMES = ["ATTACK", "DEFEND", "TRANSITION", "NEUTRAL"] as const;
export type Theme = (typeof THEMES)[number];
export const THEME_LABELS: Record<Theme, string> = {
  ATTACK: "Aanvallen",
  DEFEND: "Verdedigen",
  TRANSITION: "Omschakelen",
  NEUTRAL: "Neutraal",
};
// Themes a coach can pick for a whole session (NEUTRAL is only for warm-ups etc.)
export const SESSION_THEMES = ["ATTACK", "DEFEND", "TRANSITION"] as const;

export const FIELD_TYPES = ["CIRCUIT", "QUARTER", "HALF", "FULL", "INDOOR"] as const;
export type FieldType = (typeof FIELD_TYPES)[number];
export const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  CIRCUIT: "Circuit",
  QUARTER: "Kwart veld",
  HALF: "Half veld",
  FULL: "Heel veld",
  INDOOR: "Zaal",
};

export const AID_TYPES = [
  "BIG_GOAL",
  "SMALL_GOAL",
  "DISC_CONE",
  "CONE",
  "PLAYER",
  "BALL",
  "MARKER",
] as const;
export type AidType = (typeof AID_TYPES)[number];
export const AID_TYPE_LABELS: Record<AidType, string> = {
  BIG_GOAL: "Groot doel",
  SMALL_GOAL: "Klein doel / pupillendoel",
  DISC_CONE: "Schijfhoedje",
  CONE: "Pylon",
  PLAYER: "Speler",
  BALL: "Bal",
  MARKER: "Markering",
};

export const SPACE_TYPES = ["HALF", "QUARTER", "FULL", "INDOOR"] as const;
export type SpaceType = (typeof SPACE_TYPES)[number];
export const SPACE_TYPE_LABELS: Record<SpaceType, string> = {
  HALF: "Half veld",
  QUARTER: "Kwart veld",
  FULL: "Heel veld",
  INDOOR: "Zaal",
};

export const AGE_CATEGORIES = [
  "U7",
  "U9",
  "U11",
  "U13",
  "U15",
  "U17",
  "U19",
] as const;
export type AgeCategory = (typeof AGE_CATEGORIES)[number];

// Central KNVB learning goal (leerdoel) per age category.
export const AGE_GOAL: Record<AgeCategory, string> = {
  U7: "Beheersen van de bal",
  U9: "Doelgericht handelen met de bal",
  U11: "Doelgericht samenspelen",
  U13: "Spelen vanuit een basistaak",
  U15: "Afstemmen van basistaken binnen het team",
  U17: "Spelen als een team",
  U19: "Presteren als team in de competitie",
};

// Numeric mid-age used to match a category against a drill's ageMin/ageMax range.
export const AGE_CATEGORY_YEARS: Record<AgeCategory, number> = {
  U7: 6,
  U9: 8,
  U11: 10,
  U13: 12,
  U15: 14,
  U17: 16,
  U19: 18,
};

export const BALL_SCALINGS = ["FIXED", "PER_PLAYER", "PER_PAIR"] as const;
export type BallScaling = (typeof BALL_SCALINGS)[number];
export const BALL_SCALING_LABELS: Record<BallScaling, string> = {
  FIXED: "Vast aantal (geplaatste ballen)",
  PER_PLAYER: "Eén bal per speler",
  PER_PAIR: "Eén bal per tweetal",
};

export const BLOCK_KINDS = ["WHOLE", "SPLIT"] as const;
export type BlockKind = (typeof BLOCK_KINDS)[number];

export const STATION_GROUPS = ["ALL", "A", "B"] as const;
export type StationGroup = (typeof STATION_GROUPS)[number];

export const STATION_SIDES = ["FULL", "LEFT", "RIGHT"] as const;
export type StationSide = (typeof STATION_SIDES)[number];

// ---- Zod helpers -----------------------------------------------------------
export const zDrillType = z.enum(DRILL_TYPES);
export const zTheme = z.enum(THEMES);
export const zFieldType = z.enum(FIELD_TYPES);
export const zAidType = z.enum(AID_TYPES);
export const zSpaceType = z.enum(SPACE_TYPES);
export const zAgeCategory = z.enum(AGE_CATEGORIES);
export const zBallScaling = z.enum(BALL_SCALINGS);
