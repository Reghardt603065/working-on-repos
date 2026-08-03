import { prisma } from "@/lib/prisma";
import { certificationSchema } from "@/lib/validation";
import { jsonError, jsonSuccess, readJson, requireApiUser } from "@/lib/api";
import { recordActivity } from "@/lib/activity";

export async function GET() {
  const sessionUser = await requireApiUser();
  if (!sessionUser) return jsonError("Unauthorized", 401);
  const certifications = await prisma.certification.findMany({
    where: { userId: sessionUser.id },
    orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
  });
  return jsonSuccess(certifications);
}

export async function POST(request: Request) {
  const sessionUser = await requireApiUser();
  if (!sessionUser) return jsonError("Unauthorized", 401);
  const parsed = certificationSchema.safeParse(await readJson(request));
  if (!parsed.success) return jsonError("Invalid certification", 422, parsed.error.flatten());

  const certification = await prisma.certification.create({
    data: {
      userId: sessionUser.id,
      name: parsed.data.name,
      issuer: parsed.data.issuer,
      status: parsed.data.status,
      progress: parsed.data.status === "COMPLETED" ? 100 : parsed.data.progress,
      issueDate: parsed.data.issueDate ? new Date(parsed.data.issueDate) : null,
      expiryDate: parsed.data.expiryDate ? new Date(parsed.data.expiryDate) : null,
      credentialUrl: parsed.data.credentialUrl || null,
      skills: parsed.data.skills,
    },
  });
  await recordActivity(sessionUser.id, "CERTIFICATION_ADDED", `Added certification: ${certification.name}`);
  return jsonSuccess(certification, 201);
}
