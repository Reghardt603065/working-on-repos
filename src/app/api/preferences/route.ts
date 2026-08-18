import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { jsonError, jsonSuccess, readJson, requireApiUser } from "@/lib/api";

const schema = z.object({
  newJobs: z.boolean(),
  applicationReminders: z.boolean(),
  certificationReminders: z.boolean(),
  peerUpdates: z.boolean(),
  hackathonReminders: z.boolean(),
});

export async function GET() {
  const sessionUser = await requireApiUser();
  if (!sessionUser) return jsonError("Unauthorized", 401);
  const preferences = await prisma.notificationPreference.upsert({
    where: { userId: sessionUser.id },
    create: { userId: sessionUser.id },
    update: {},
  });
  return jsonSuccess(preferences);
}

export async function PATCH(request: Request) {
  const sessionUser = await requireApiUser();
  if (!sessionUser) return jsonError("Unauthorized", 401);
  const parsed = schema.safeParse(await readJson(request));
  if (!parsed.success) return jsonError("Invalid preferences", 422, parsed.error.flatten());
  const preferences = await prisma.notificationPreference.upsert({
    where: { userId: sessionUser.id },
    create: { userId: sessionUser.id, ...parsed.data },
    update: parsed.data,
  });
  return jsonSuccess(preferences);
}
