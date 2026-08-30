"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getDefaultLineup } from "@/lib/matches";
import { DEFAULT_FORMATION } from "@/lib/formations";
import {
  defaultLineupSchema,
  parseDefaultLineupForm,
  parseLineupForm,
  parseMatchForm,
} from "@/lib/validation";

const USE_DEFAULT = "__default__";

export async function createMatch(formData: FormData) {
  // "__default__" = start from the coach's default lineup (its formation + players);
  // any real formation key = an empty lineup the coach fills themselves.
  const choseDefault = formData.get("formation") === USE_DEFAULT;
  const template = choseDefault ? await getDefaultLineup() : null;
  if (choseDefault) {
    formData.set("formation", template?.formation ?? DEFAULT_FORMATION);
  }

  const data = parseMatchForm(formData);
  const created = await prisma.match.create({ data });

  if (template && template.entries.length > 0) {
    // Only copy players still on the (active) roster.
    const active = await prisma.player.findMany({
      where: { active: true },
      select: { id: true },
    });
    const activeIds = new Set(active.map((p) => p.id));
    const entries = template.entries.filter((e) => activeIds.has(e.playerId));
    if (entries.length > 0) {
      await prisma.lineupEntry.createMany({
        data: entries.map((e) => ({
          matchId: created.id,
          playerId: e.playerId,
          role: e.role,
          x: e.x,
          y: e.y,
          slot: e.slot,
        })),
      });
    }
  }

  revalidatePath("/wedstrijden");
  redirect(`/wedstrijden/${created.id}`);
}

export async function updateMatch(id: number, formData: FormData) {
  const data = parseMatchForm(formData);
  await prisma.match.update({ where: { id }, data });
  revalidatePath("/wedstrijden");
  revalidatePath(`/wedstrijden/${id}`);
  redirect(`/wedstrijden/${id}`);
}

export async function deleteMatch(id: number) {
  await prisma.match.delete({ where: { id } });
  revalidatePath("/wedstrijden");
  redirect("/wedstrijden");
}

export async function saveLineup(matchId: number, formData: FormData) {
  const entries = parseLineupForm(formData);
  // The builder's formation travels with the lineup, so persist it onto the match.
  const { formation } = defaultLineupSchema.parse({
    formation: formData.get("formation"),
  });
  // Only persist players the coach actually touched (placed or explicitly benched/
  // unavailable); everyone else stays an implicit "available" with no row.
  await prisma.$transaction([
    prisma.match.update({ where: { id: matchId }, data: { formation } }),
    prisma.lineupEntry.deleteMany({ where: { matchId } }),
    prisma.lineupEntry.createMany({
      data: entries.map((e) => ({
        matchId,
        playerId: e.playerId,
        role: e.role,
        x: e.x ?? null,
        y: e.y ?? null,
        slot: e.slot ?? null,
      })),
    }),
  ]);
  revalidatePath(`/wedstrijden/${matchId}`);
  revalidatePath("/wedstrijden");
}

/**
 * Save the current builder state as the coach's default lineup (singleton template).
 * New matches pre-fill from this. Posted from the lineup form via a formAction button,
 * so it receives the same hidden `formation` + `lineup` fields.
 */
export async function saveDefaultLineup(formData: FormData) {
  const { formation, entries } = parseDefaultLineupForm(formData);
  await prisma.$transaction([
    prisma.lineupTemplate.upsert({
      where: { id: 1 },
      create: { id: 1, formation },
      update: { formation },
    }),
    prisma.lineupTemplateEntry.deleteMany({ where: { templateId: 1 } }),
    prisma.lineupTemplateEntry.createMany({
      data: entries.map((e) => ({
        templateId: 1,
        playerId: e.playerId,
        role: e.role,
        x: e.x ?? null,
        y: e.y ?? null,
        slot: e.slot ?? null,
      })),
    }),
  ]);
  revalidatePath("/wedstrijden");
}
