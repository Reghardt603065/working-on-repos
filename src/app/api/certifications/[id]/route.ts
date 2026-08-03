import { prisma } from "@/lib/prisma";
import { certificationSchema } from "@/lib/validation";
import { jsonError, jsonSuccess, readJson, requireApiUser } from "@/lib/api";
import { recordActivity } from "@/lib/activity";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const sessionUser = await requireApiUser();
  if (!sessionUser) return jsonError("Unauthorized", 401);
  const { id } = await context.params;
  const parsed = certificationSchema.partial().safeParse(await readJson(request));
  if (!parsed.success) return jsonError("Invalid certification update", 422, parsed.error.flatten());

  const existing = await prisma.certification.findFirst({ where: { id, userId: sessionUser.id } });
  if (!existing) return jsonError("Certification not found", 404);

  const updated = await prisma.certification.update({
    where: { id },
    data: {
      ...parsed.data,
      progress: parsed.data.status === "COMPLETED" ? 100 : parsed.data.progress,
      issueDate: parsed.data.issueDate ? new Date(parsed.data.issueDate) : parsed.data.issueDate === null ? null : undefined,
      expiryDate: parsed.data.expiryDate ? new Date(parsed.data.expiryDate) : parsed.data.expiryDate === null ? null : undefined,
      credentialUrl: parsed.data.credentialUrl || null,
    },
  });
  if (updated.status === "COMPLETED" && existing.status !== "COMPLETED") {
    await recordActivity(sessionUser.id, "CERTIFICATION_COMPLETED", `Completed certification: ${updated.name}`);
  }
  return jsonSuccess(updated);
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const sessionUser = await requireApiUser();
  if (!sessionUser) return jsonError("Unauthorized", 401);
  const { id } = await context.params;
  const result = await prisma.certification.deleteMany({ where: { id, userId: sessionUser.id } });
  if (!result.count) return jsonError("Certification not found", 404);
  return jsonSuccess({ deleted: true });
}
