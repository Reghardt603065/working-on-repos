import { prisma } from "@/lib/prisma";
import { buildLinkedInShareUrl } from "@/lib/linkedin";
import { jsonError, jsonSuccess, requireApiUser } from "@/lib/api";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const sessionUser = await requireApiUser();
  if (!sessionUser) return jsonError("Unauthorized", 401);

  const project = await prisma.portfolioProject.findUnique({
    where: { id: params.id },
    select: { id: true, userId: true, title: true, githubUrl: true, liveUrl: true },
  });

  if (!project || project.userId !== sessionUser.id) {
    return jsonError("Portfolio project not found", 404);
  }

  const shareTarget = project.liveUrl || project.githubUrl;
  if (!shareTarget) {
    return jsonError("This project has no link to share", 400);
  }

  return jsonSuccess({
    title: project.title,
    shareUrl: buildLinkedInShareUrl(shareTarget),
  });
}