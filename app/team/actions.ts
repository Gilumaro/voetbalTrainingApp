"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  parsePlayerCommentForm,
  parsePlayerForm,
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

