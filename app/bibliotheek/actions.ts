"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { parseDrillForm } from "@/lib/validation";

export async function createDrill(formData: FormData) {
  const { aids, ...drill } = parseDrillForm(formData);
  const created = await prisma.drill.create({
    data: { ...drill, aids: { create: aids } },
  });
  revalidatePath("/bibliotheek");
  redirect(`/bibliotheek/${created.id}`);
}

export async function updateDrill(id: number, formData: FormData) {
  const { aids, ...drill } = parseDrillForm(formData);
  await prisma.drill.update({
    where: { id },
    data: { ...drill, aids: { deleteMany: {}, create: aids } },
  });
  revalidatePath("/bibliotheek");
  revalidatePath(`/bibliotheek/${id}`);
  redirect(`/bibliotheek/${id}`);
}

export async function deleteDrill(id: number) {
  await prisma.drill.delete({ where: { id } });
  revalidatePath("/bibliotheek");
  redirect("/bibliotheek");
}
