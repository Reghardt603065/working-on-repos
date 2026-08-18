import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { jsonError, jsonSuccess, readJson, requireApiUser } from "@/lib/api";

const patchSchema = z.object({ id: z.string().uuid().optional(), markAllRead: z.boolean().optional() });

export async function GET() {
  const sessionUser = await requireApiUser();
  if (!sessionUser) return jsonError("Unauthorized", 401);
  const notifications = await prisma.notification.findMany({
    where: { userId: sessionUser.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return jsonSuccess(notifications);
}

export async function PATCH(request: Request) {
  const sessionUser = await requireApiUser();
  if (!sessionUser) return jsonError("Unauthorized", 401);
  const parsed = patchSchema.safeParse(await readJson(request));
  if (!parsed.success) return jsonError("Invalid notification update", 422);

  if (parsed.data.markAllRead) {
    await prisma.notification.updateMany({ where: { userId: sessionUser.id, readAt: null }, data: { readAt: new Date() } });
    return jsonSuccess({ updated: "all" });
  }
  if (!parsed.data.id) return jsonError("Notification id is required");
  const updated = await prisma.notification.updateMany({
    where: { id: parsed.data.id, userId: sessionUser.id },
    data: { readAt: new Date() },
  });
  if (!updated.count) return jsonError("Notification not found", 404);
  return jsonSuccess({ updated: parsed.data.id });
}
