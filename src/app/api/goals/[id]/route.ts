import { prisma } from "@/lib/prisma";
import { goalSchema } from "@/lib/validation";
import { jsonError, jsonSuccess, readJson, requireApiUser } from "@/lib/api";
import { recordActivity } from "@/lib/activity";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const sessionUser = await requireApiUser();
  if (!sessionUser) return jsonError("Unauthorized", 401);
  const { id } = await context.params;
  const parsed = goalSchema.partial().safeParse(await readJson(request));
  if (!parsed.success) return jsonError("Invalid goal update", 422, parsed.error.flatten());
  const existing = await prisma.goal.findFirst({ where: { id, ownerId: sessionUser.id } });
  if (!existing) return jsonError("Goal not found", 404);

  const goal = await prisma.goal.update({
    where: { id },
    data: {
      ...parsed.data,
      partnerId: parsed.data.partnerId || undefined,
      targetDate: parsed.data.targetDate ? new Date(parsed.data.targetDate) : parsed.data.targetDate === null ? null : undefined,
    },
  });
  await recordActivity(sessionUser.id, "GOAL_UPDATED", `Updated goal: ${goal.title}`, { progress: goal.progress });
  return jsonSuccess(goal);
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const sessionUser = await requireApiUser();
  if (!sessionUser) return jsonError("Unauthorized", 401);
  const { id } = await context.params;
  const result = await prisma.goal.deleteMany({ where: { id, ownerId: sessionUser.id } });
  if (!result.count) return jsonError("Goal not found", 404);
  return jsonSuccess({ deleted: true });
}
