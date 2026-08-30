"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  parseAttendanceForm,
  parsePlayerCommentForm,
  parsePlayerForm,
  parseTrainingEventForm,
} from "@/lib/validation";

// ---- Players ---------------------------------------------------------------

export async function createPlayer(formData: FormData) {
  const data = parsePlayerForm(formData);
  const created = await prisma.player.create({ data });
  revalidatePath("/team");
  redirect(`/team/${created.id}`);
}

export async function updatePlayer(id: number, formData: FormData) {
  const data = parsePlayerForm(formData);
  await prisma.player.update({ where: { id }, data });
  revalidatePath("/team");
  revalidatePath(`/team/${id}`);
  redirect(`/team/${id}`);
}

export async function deletePlayer(id: number) {
  await prisma.player.delete({ where: { id } });
  revalidatePath("/team");
  redirect("/team");
}

export async function addPlayerComment(playerId: number, formData: FormData) {
  const { text } = parsePlayerCommentForm(formData);
  await prisma.playerComment.create({ data: { playerId, text } });
  revalidatePath(`/team/${playerId}`);
}

export async function deletePlayerComment(id: number, playerId: number) {
  await prisma.playerComment.delete({ where: { id } });
  revalidatePath(`/team/${playerId}`);
}

// ---- Training events & attendance ------------------------------------------

export async function createTrainingEvent(formData: FormData) {
  const data = parseTrainingEventForm(formData);
  const created = await prisma.trainingEvent.create({ data });
  revalidatePath("/team/aanwezigheid");
  redirect(`/team/aanwezigheid/${created.id}`);
}

export async function deleteTrainingEvent(id: number) {
  await prisma.trainingEvent.delete({ where: { id } });
  revalidatePath("/team/aanwezigheid");
  revalidatePath("/team/overzicht");
  redirect("/team/aanwezigheid");
}

export async function saveAttendance(eventId: number, formData: FormData) {
  const rows = parseAttendanceForm(formData);
  // Replace the whole event's attendance in one go (mirrors updateDrill's child swap).
  await prisma.$transaction([
    prisma.attendance.deleteMany({ where: { eventId } }),
    prisma.attendance.createMany({
      data: rows.map((r) => ({
        eventId,
        playerId: r.playerId,
        present: r.present,
        didCleanup: r.didCleanup,
      })),
    }),
  ]);
  revalidatePath(`/team/aanwezigheid/${eventId}`);
  revalidatePath("/team/aanwezigheid");
  revalidatePath("/team/overzicht");
  redirect("/team/aanwezigheid");
}
