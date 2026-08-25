import { z } from "zod";
import {
  zActionKind,
  zAidType,
  zBallScaling,
  zDrillType,
  zFieldType,
  zSubTheme,
  zTheme,
} from "./enums";

const emptyToUndef = (v: unknown) =>
  typeof v === "string" && v.trim() === "" ? undefined : v;

export const aidSchema = z.object({
  type: zAidType,
  x: z.coerce.number().min(0).max(120),
  y: z.coerce.number().min(0).max(120),
  rotation: z.coerce.number().default(0),
  label: z.preprocess(emptyToUndef, z.string().trim().max(60).optional()),
});

export type AidInput = z.infer<typeof aidSchema>;

export const actionSchema = z.object({
  kind: zActionKind,
  fromX: z.coerce.number().min(0).max(120),
  fromY: z.coerce.number().min(0).max(120),
  toX: z.coerce.number().min(0).max(120),
  toY: z.coerce.number().min(0).max(120),
  order: z.coerce.number().int().default(0),
  label: z.preprocess(emptyToUndef, z.string().trim().max(60).optional()),
});

export type ActionInput = z.infer<typeof actionSchema>;

export const drillSchema = z
  .object({
    title: z.string().trim().min(2, "Titel is te kort").max(120),
    type: zDrillType,
    theme: zTheme,
    subTheme: z.preprocess(emptyToUndef, zSubTheme.optional()),
    ageMin: z.coerce.number().int().min(4).max(21),
    ageMax: z.coerce.number().int().min(4).max(21),
    fieldType: zFieldType,
    footprintX: z.coerce.number().min(3).max(120),
    footprintY: z.coerce.number().min(3).max(120),
    minPlayers: z.coerce.number().int().min(1).max(30),
    idealPlayers: z.coerce.number().int().min(1).max(30),
    maxPlayers: z.coerce.number().int().min(1).max(30),
    durationMin: z.coerce.number().int().min(1).max(60),
    ballScaling: zBallScaling.default("FIXED"),
    description: z.string().trim().min(3, "Omschrijving ontbreekt"),
    setup: z.preprocess(emptyToUndef, z.string().trim().optional()),
    // Ordered instruction lines; stored in the DB as a JSON string (see actions.ts).
    steps: z.array(z.string().trim().min(1)).default([]),
    rules: z.preprocess(emptyToUndef, z.string().trim().optional()),
    coachingPoints: z.preprocess(emptyToUndef, z.string().trim().optional()),
    progressions: z.preprocess(emptyToUndef, z.string().trim().optional()),
    simplifications: z.preprocess(emptyToUndef, z.string().trim().optional()),
    videoUrl: z.preprocess(
      emptyToUndef,
      z.string().trim().url("Ongeldige URL").optional(),
    ),
    aids: z.array(aidSchema).default([]),
    actions: z.array(actionSchema).default([]),
  })
  .refine((d) => d.minPlayers <= d.idealPlayers && d.idealPlayers <= d.maxPlayers, {
    message: "Spelersaantallen moeten oplopen: min ≤ ideaal ≤ max",
    path: ["idealPlayers"],
  })
  .refine((d) => d.ageMin <= d.ageMax, {
    message: "Minimumleeftijd moet ≤ maximumleeftijd zijn",
    path: ["ageMax"],
  });

export type DrillInput = z.infer<typeof drillSchema>;

function parseJson(formData: FormData, field: string): unknown {
  try {
    return JSON.parse((formData.get(field) as string) || "[]");
  } catch {
    return [];
  }
}

/**
 * Parse a submitted drill <form>: scalar fields from FormData + aids/actions/steps
 * as JSON (mirroring how the client serialises them into hidden inputs).
 */
export function parseDrillForm(formData: FormData): DrillInput {
  const raw = Object.fromEntries(formData) as Record<string, unknown>;
  const aids = parseJson(formData, "aids");
  const rawActions = parseJson(formData, "actions") as ActionInput[];
  // Assign play order from array position so the coach doesn't manage it by hand.
  const actions = Array.isArray(rawActions)
    ? rawActions.map((a, i) => ({ ...a, order: i }))
    : [];
  const steps = parseJson(formData, "steps");
  return drillSchema.parse({ ...raw, aids, actions, steps });
}
