import { prisma } from "@/lib/prisma";
import { fetchGitHubRepositories } from "@/lib/github";
import { jsonError, jsonSuccess, readJson, requireApiUser } from "@/lib/api";
import { recordActivity } from "@/lib/activity";

export async function POST(request: Request) {
  const sessionUser = await requireApiUser();
  if (!sessionUser) return jsonError("Unauthorized", 401);

  const body = await readJson(request);
  const username = String(body?.username || "").trim();
  if (!username) return jsonError("GitHub username is required");

  try {
    const repositories = await fetchGitHubRepositories(username);
    let imported = 0;
    let updated = 0;

    for (const repository of repositories) {
      const existing = await prisma.portfolioProject.findUnique({
        where: { userId_slug: { userId: sessionUser.id, slug: repository.slug } },
        select: { id: true },
      });

      await prisma.portfolioProject.upsert({
        where: { userId_slug: { userId: sessionUser.id, slug: repository.slug } },
        create: {
          userId: sessionUser.id,
          title: repository.title,
          slug: repository.slug,
          description: repository.description,
          technologies: repository.technologies.slice(0, 20),
          githubUrl: repository.githubUrl,
          liveUrl: repository.liveUrl,
          featured: repository.featured,
          source: "GITHUB",
        },
        update: {
          title: repository.title,
          description: repository.description,
          technologies: repository.technologies.slice(0, 20),
          githubUrl: repository.githubUrl,
          liveUrl: repository.liveUrl,
          featured: repository.featured,
          source: "GITHUB",
        },
      });

      existing ? (updated += 1) : (imported += 1);
    }

    await prisma.user.update({
      where: { id: sessionUser.id },
      data: { githubUsername: username },
    });
    await recordActivity(sessionUser.id, "GITHUB_SYNCED", `Synced GitHub profile @${username}`, {
      imported,
      updated,
    });

    return jsonSuccess({ imported, updated, total: repositories.length });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "GitHub sync failed", 502);
  }
}
