import { prisma } from "@/lib/prisma";
import { jsonError, jsonSuccess, requireApiUser } from "@/lib/api";
import { recordActivity } from "@/lib/activity";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const sessionUser = await requireApiUser();
  if (!sessionUser) return jsonError("Unauthorized", 401);
  const { id } = await context.params;

  const job = await prisma.jobListing.findUnique({ where: { id }, select: { id: true, title: true } });
  if (!job) return jsonError("Job not found", 404);

  const saved = await prisma.savedJob.upsert({
    where: { userId_jobId: { userId: sessionUser.id, jobId: id } },
    create: { userId: sessionUser.id, jobId: id },
    update: {},
  });
  await recordActivity(sessionUser.id, "JOB_SAVED", `Saved job: ${job.title}`, { jobId: id });
  return jsonSuccess(saved, 201);
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const sessionUser = await requireApiUser();
  if (!sessionUser) return jsonError("Unauthorized", 401);
  const { id } = await context.params;

  await prisma.savedJob.deleteMany({ where: { userId: sessionUser.id, jobId: id } });
  return jsonSuccess({ removed: true });
}
