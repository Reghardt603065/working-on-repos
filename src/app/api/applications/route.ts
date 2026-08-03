import { prisma } from "@/lib/prisma";
import { applicationSchema } from "@/lib/validation";
import { jsonError, jsonSuccess, readJson, requireApiUser } from "@/lib/api";
import { recordActivity } from "@/lib/activity";

export async function GET() {
  const sessionUser = await requireApiUser();
  if (!sessionUser) return jsonError("Unauthorized", 401);

  const applications = await prisma.jobApplication.findMany({
    where: { userId: sessionUser.id },
    include: { job: true },
    orderBy: { updatedAt: "desc" },
  });
  return jsonSuccess(applications);
}

export async function POST(request: Request) {
  const sessionUser = await requireApiUser();
  if (!sessionUser) return jsonError("Unauthorized", 401);
  const parsed = applicationSchema.safeParse(await readJson(request));
  if (!parsed.success) return jsonError("Invalid application data", 422, parsed.error.flatten());

  const job = await prisma.jobListing.findUnique({ where: { id: parsed.data.jobId } });
  if (!job) return jsonError("Job not found", 404);

  const application = await prisma.jobApplication.upsert({
    where: { userId_jobId: { userId: sessionUser.id, jobId: parsed.data.jobId } },
    create: {
      userId: sessionUser.id,
      jobId: parsed.data.jobId,
      status: parsed.data.status,
      appliedAt: parsed.data.appliedAt ? new Date(parsed.data.appliedAt) : parsed.data.status === "APPLIED" ? new Date() : null,
      deadline: parsed.data.deadline ? new Date(parsed.data.deadline) : null,
      notes: parsed.data.notes || null,
    },
    update: {
      status: parsed.data.status,
      appliedAt: parsed.data.appliedAt ? new Date(parsed.data.appliedAt) : undefined,
      deadline: parsed.data.deadline ? new Date(parsed.data.deadline) : null,
      notes: parsed.data.notes || null,
    },
  });

  if (parsed.data.status === "APPLIED") {
    await recordActivity(sessionUser.id, "JOB_APPLIED", `Applied for ${job.title} at ${job.company}`, { jobId: job.id });
  }
  return jsonSuccess(application, 201);
}
