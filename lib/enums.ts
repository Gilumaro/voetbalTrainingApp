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

export const THEMES = [
  "ATTACK",
  "DEFEND",
  "TRANSITION",
  "NEUTRAL",
  "SET_PIECE",
  "CONDITIE",
] as const;
export type Theme = (typeof THEMES)[number];
export const THEME_LABELS: Record<Theme, string> = {
  ATTACK: "Aanvallen",
  DEFEND: "Verdedigen",
  TRANSITION: "Omschakelen",
  NEUTRAL: "Neutraal",
  SET_PIECE: "Standaardsituaties",
  CONDITIE: "Conditie / atletisch vermogen",
};
// Themes a coach can pick for a whole session (NEUTRAL is only for warm-ups etc.;
// SET_PIECE is library-only — set pieces need the full goal/pitch and have no partijvorm,
// so they don't fit the auto-generator's shape and are added to sessions by hand).
export const SESSION_THEMES = ["ATTACK", "DEFEND", "TRANSITION", "CONDITIE"] as const;

// Sub-themes (KNVB leerdoelen) per main theme. The Dutch label is the stored value.
export const SUB_THEMES: Record<Theme, string[]> = {
  ATTACK: [
    "Creëren van kansen",
    "Dieptespel in opbouw verbeteren",
    "Ontdekken van lichaam en bal en daarmee gericht handelen",
    "Positiespel in opbouw verbeteren",
    "Scoren verbeteren",
    "Uitspelen van één tegen één situatie verbeteren",
  ],
  DEFEND: [
    "Storen en veroveren van de bal verbeteren",
    "Verdedigen van dieptespel verbeteren",
    "Verdedigen van één tegen één situatie verbeteren",
    "Verdedigen wanneer de tegenstander kansen creëert verbeteren",
    "Voorkomen van doelpunten verbeteren",
  ],
  TRANSITION: [
    "Omschakelen bij veroveren van de bal verbeteren",
    "Omschakelen op moment van balverlies verbeteren",
  ],
  NEUTRAL: [
    "Balgewenning en baltechniek",
    "Passen en aannemen",
    "Dribbelen en richtingsverandering",
    "Positiespel en balbezit",
    "Warming-up en activeren",
    "Partijspel (vrije wedstrijdvorm)",
  ],
  SET_PIECE: [
    "Aanvallende hoekschop",
    "Verdedigen van de hoekschop",
    "Aanvallende vrije trap",
    "Verdedigen van de vrije trap",
    "Strafschop nemen en verdedigen",
    "Inworp",
    "Aftrap",
  ],
  CONDITIE: [
    "Uithoudingsvermogen met bal",
    "Snelheid en acceleratie",
    "Coördinatie en wendbaarheid",
    "Kracht en stabiliteit",
    "Loopscholing en activeren",
  ],
};
export const ALL_SUB_THEMES = Array.from(new Set(Object.values(SUB_THEMES).flat()));

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
  "PLAYER_OPP",
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
  PLAYER_OPP: "Tegenstander",
  BALL: "Bal",
  MARKER: "Markering",
};

// Player-like aids (drawn on top so their letters stay visible above cones/lines).
export const PLAYER_AID_TYPES: AidType[] = ["PLAYER", "PLAYER_OPP"];

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

// Drill action kinds — an ordered movement drawn as an arrow (and animated later).
export const ACTION_KINDS = ["PASS", "RUN", "DRIBBLE", "SHOT", "CARRY"] as const;
export type ActionKind = (typeof ACTION_KINDS)[number];
export const ACTION_KIND_LABELS: Record<ActionKind, string> = {
  PASS: "Pass",
  RUN: "Loopactie (zonder bal)",
  DRIBBLE: "Dribbel",
  SHOT: "Schot op doel",
  CARRY: "Meenemen (met bal)",
};

export const BLOCK_KINDS = ["WHOLE", "SPLIT"] as const;
export type BlockKind = (typeof BLOCK_KINDS)[number];

export const STATION_GROUPS = ["ALL", "A", "B"] as const;
export type StationGroup = (typeof STATION_GROUPS)[number];

export const STATION_SIDES = ["FULL", "LEFT", "RIGHT"] as const;
export type StationSide = (typeof STATION_SIDES)[number];

// ---- Team / player positions ----------------------------------------------
// Granular position codes, shared by a player's preferred position and by the
// slots of a formation (see lib/formations.ts), so the lineup builder can hint.
export const POSITION_CODES = [
  "GK",
  "LB",
  "LCB",
  "CB",
  "RCB",
  "RB",
  "LWB",
  "RWB",
  "DM",
  "CM",
  "LM",
  "RM",
  "AM",
  "LW",
  "RW",
  "ST",
] as const;
export type PositionCode = (typeof POSITION_CODES)[number];
export const POSITION_LABELS: Record<PositionCode, string> = {
  GK: "Keeper",
  LB: "Linksback",
  LCB: "Centrale verdediger (links)",
  CB: "Centrale verdediger",
  RCB: "Centrale verdediger (rechts)",
  RB: "Rechtsback",
  LWB: "Linkervleugelverdediger",
  RWB: "Rechtervleugelverdediger",
  DM: "Verdedigende middenvelder",
  CM: "Centrale middenvelder",
  LM: "Linkshalf",
  RM: "Rechtshalf",
  AM: "Aanvallende middenvelder",
  LW: "Linksbuiten",
  RW: "Rechtsbuiten",
  ST: "Spits",
};

// Four lines, for grouping/colour in the roster and lineup views.
export const POSITION_LINES = ["KEEPER", "VERDEDIGING", "MIDDENVELD", "AANVAL"] as const;
export type PositionLine = (typeof POSITION_LINES)[number];
export const POSITION_LINE_LABELS: Record<PositionLine, string> = {
  KEEPER: "Keeper",
  VERDEDIGING: "Verdediging",
  MIDDENVELD: "Middenveld",
  AANVAL: "Aanval",
};
export const POSITION_LINE: Record<PositionCode, PositionLine> = {
  GK: "KEEPER",
  LB: "VERDEDIGING",
  LCB: "VERDEDIGING",
  CB: "VERDEDIGING",
  RCB: "VERDEDIGING",
  RB: "VERDEDIGING",
  LWB: "VERDEDIGING",
  RWB: "VERDEDIGING",
  DM: "MIDDENVELD",
  CM: "MIDDENVELD",
  LM: "MIDDENVELD",
  RM: "MIDDENVELD",
  AM: "MIDDENVELD",
  LW: "AANVAL",
  RW: "AANVAL",
  ST: "AANVAL",
};

export const HOME_AWAY = ["THUIS", "UIT"] as const;
export type HomeAway = (typeof HOME_AWAY)[number];
export const HOME_AWAY_LABELS: Record<HomeAway, string> = {
  THUIS: "Thuis",
  UIT: "Uit",
};

export const LINEUP_ROLES = ["STARTER", "BENCH", "UNAVAILABLE"] as const;
export type LineupRole = (typeof LINEUP_ROLES)[number];
export const LINEUP_ROLE_LABELS: Record<LineupRole, string> = {
  STARTER: "Basis",
  BENCH: "Wissel",
  UNAVAILABLE: "Niet beschikbaar",
};

// ---- Zod helpers -----------------------------------------------------------
export const zDrillType = z.enum(DRILL_TYPES);
export const zTheme = z.enum(THEMES);
export const zFieldType = z.enum(FIELD_TYPES);
export const zAidType = z.enum(AID_TYPES);
export const zSpaceType = z.enum(SPACE_TYPES);
export const zAgeCategory = z.enum(AGE_CATEGORIES);
export const zBallScaling = z.enum(BALL_SCALINGS);
export const zActionKind = z.enum(ACTION_KINDS);
export const zSubTheme = z.string().refine((v) => ALL_SUB_THEMES.includes(v), {
  message: "Onbekend sub-thema",
});
export const zPositionCode = z.enum(POSITION_CODES);
export const zHomeAway = z.enum(HOME_AWAY);
export const zLineupRole = z.enum(LINEUP_ROLES);
