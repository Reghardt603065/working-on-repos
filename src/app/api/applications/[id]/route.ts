import { prisma } from "@/lib/prisma";
import { jsonError, jsonSuccess, readJson, requireApiUser } from "@/lib/api";
import { z } from "zod";

const patchSchema = z.object({
  status: z.enum(["SAVED", "APPLIED", "INTERVIEW", "OFFER", "REJECTED", "WITHDRAWN"]).optional(),
  deadline: z.string().nullable().optional(),
  notes: z.string().trim().max(1000).optional(),
});

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const sessionUser = await requireApiUser();
  if (!sessionUser) return jsonError("Unauthorized", 401);
  const { id } = await context.params;
  const parsed = patchSchema.safeParse(await readJson(request));
  if (!parsed.success) return jsonError("Invalid application update", 422, parsed.error.flatten());

  const existing = await prisma.jobApplication.findFirst({ where: { id, userId: sessionUser.id } });
  if (!existing) return jsonError("Application not found", 404);

  const updated = await prisma.jobApplication.update({
    where: { id },
    data: {
      status: parsed.data.status,
      deadline: parsed.data.deadline ? new Date(parsed.data.deadline) : parsed.data.deadline === null ? null : undefined,
      notes: parsed.data.notes,
    },
  });
  return jsonSuccess(updated);
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const sessionUser = await requireApiUser();
  if (!sessionUser) return jsonError("Unauthorized", 401);
  const { id } = await context.params;
  const deleted = await prisma.jobApplication.deleteMany({ where: { id, userId: sessionUser.id } });
  if (!deleted.count) return jsonError("Application not found", 404);
  return jsonSuccess({ deleted: true });
}
