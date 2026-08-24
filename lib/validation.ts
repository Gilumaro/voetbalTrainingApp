import { z } from "zod";
import {
  zAidType,
  zBallScaling,
  zDrillType,
  zFieldType,
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

export const drillSchema = z
  .object({
    title: z.string().trim().min(2, "Titel is te kort").max(120),
    type: zDrillType,
    theme: zTheme,
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
    coachingPoints: z.preprocess(emptyToUndef, z.string().trim().optional()),
    progressions: z.preprocess(emptyToUndef, z.string().trim().optional()),
    simplifications: z.preprocess(emptyToUndef, z.string().trim().optional()),
    videoUrl: z.preprocess(
      emptyToUndef,
      z.string().trim().url("Ongeldige URL").optional(),
    ),
    aids: z.array(aidSchema).default([]),
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

/** Parse a submitted drill <form>: scalar fields from FormData + aids as JSON. */
export function parseDrillForm(formData: FormData): DrillInput {
  const raw = Object.fromEntries(formData) as Record<string, unknown>;
  let aids: unknown = [];
  try {
    aids = JSON.parse((formData.get("aids") as string) || "[]");
  } catch {
    aids = [];
  }
  return drillSchema.parse({ ...raw, aids });
}
