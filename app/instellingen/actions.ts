"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";

const schema = z.object({
  bigGoals: z.coerce.number().int().min(0).max(20),
  smallGoals: z.coerce.number().int().min(0).max(40),
  discCones: z.coerce.number().int().min(0).max(200),
  cones: z.coerce.number().int().min(0).max(200),
  pinnies: z.coerce.number().int().min(0).max(60),
  balls: z.coerce.number().int().min(0).max(60),
  pitchX: z.coerce.number().min(5).max(120),
  pitchY: z.coerce.number().min(5).max(120),
});

export async function updateSettings(formData: FormData) {
  await getSettings();
  const data = schema.parse(Object.fromEntries(formData));
  await prisma.settings.update({ where: { id: 1 }, data });
  redirect("/instellingen?opgeslagen=1");
}
