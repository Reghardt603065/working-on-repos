import { prisma } from "@/lib/prisma";
import { certificationSchema } from "@/lib/validation";
import {
  jsonError,
  jsonSuccess,
  readJson,
  requireApiUser,
} from "@/lib/api";
import { recordActivity } from "@/lib/activity";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const sessionUser = await requireApiUser();

  if (!sessionUser) {
    return jsonError("Unauthorized", 401);
  }

  const { id } = await context.params;

  const parsed = certificationSchema
    .partial()
    .safeParse(await readJson(request));

  if (!parsed.success) {
    return jsonError(
      "Invalid certification update",
      422,
      parsed.error.flatten()
    );
  }

  const existing = await prisma.certification.findFirst({
    where: {
      id,
      userId: sessionUser.id,
    },
  });

  if (!existing) {
    return jsonError("Certification not found", 404);
  }

  const updated = await prisma.certification.update({
    where: {
      id,
    },

    data: {
      // Only tracker-controlled fields are updated here.
      // Skills are intentionally preserved from the existing
      // certification so crawler-provided skills cannot disappear.
      status:
        parsed.data.status !== undefined
          ? parsed.data.status
          : undefined,

      progress:
        parsed.data.status === "COMPLETED"
          ? 100
          : parsed.data.progress !== undefined
            ? parsed.data.progress
            : undefined,

      issueDate:
        parsed.data.issueDate !== undefined
          ? parsed.data.issueDate
            ? new Date(parsed.data.issueDate)
            : null
          : undefined,

      expiryDate:
        parsed.data.expiryDate !== undefined
          ? parsed.data.expiryDate
            ? new Date(parsed.data.expiryDate)
            : null
          : undefined,

      credentialUrl:
        parsed.data.credentialUrl !== undefined
          ? parsed.data.credentialUrl || null
          : undefined,

      // IMPORTANT:
      // Do not include `skills` here.
      // Prisma will leave the existing skills unchanged.
    },
  });

  if (
    updated.status === "COMPLETED" &&
    existing.status !== "COMPLETED"
  ) {
    await recordActivity(
      sessionUser.id,
      "CERTIFICATION_COMPLETED",
      `Completed certification: ${updated.name}`
    );
  }

  return jsonSuccess(updated);
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const sessionUser = await requireApiUser();

  if (!sessionUser) {
    return jsonError("Unauthorized", 401);
  }

  const { id } = await context.params;

  const result = await prisma.certification.deleteMany({
    where: {
      id,
      userId: sessionUser.id,
    },
  });

  if (!result.count) {
    return jsonError("Certification not found", 404);
  }

  return jsonSuccess({
    deleted: true,
  });
}