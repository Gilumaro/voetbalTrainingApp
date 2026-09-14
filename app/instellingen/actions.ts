"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { AGE_CATEGORIES, SPACE_TYPES, zAgeCategory, zSpaceType } from "@/lib/enums";

const schema = z.object({
  bigGoals: z.coerce.number().int().min(0).max(20),
  smallGoals: z.coerce.number().int().min(0).max(40),
  discCones: z.coerce.number().int().min(0).max(200),
  cones: z.coerce.number().int().min(0).max(200),
  pinnies: z.coerce.number().int().min(0).max(60),
  balls: z.coerce.number().int().min(0).max(60),
  pitchX: z.coerce.number().min(5).max(120),
  pitchY: z.coerce.number().min(5).max(120),
  defaultAgeCategory: zAgeCategory,
  defaultDurationMin: z.coerce.number().int().min(30).max(120),
  defaultPlayers: z.coerce.number().int().min(4).max(30),
  defaultSpaceType: zSpaceType,
});

export async function updateSettings(formData: FormData) {
  await getSettings();

  // Checkboxes for training days come in as repeated values; absent when unchecked.
  const rawDays = formData.getAll("trainingDay");
  const trainingDays = z.array(z.coerce.number().int().min(0).max(6))
    .parse(rawDays);

  const data = schema.parse(Object.fromEntries(formData));
  await prisma.settings.update({
    where: { id: 1 },
    data: { ...data, trainingDays: JSON.stringify(trainingDays) },
  });
  redirect("/instellingen?opgeslagen=1");
}
