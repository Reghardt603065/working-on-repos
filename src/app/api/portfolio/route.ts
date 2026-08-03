import { prisma } from "@/lib/prisma";
import { portfolioProjectSchema } from "@/lib/validation";
import { jsonError, jsonSuccess, readJson, requireApiUser } from "@/lib/api";
import { slugify } from "@/lib/utils";
import { recordActivity } from "@/lib/activity";

export async function GET() {
  const sessionUser = await requireApiUser();
  if (!sessionUser) return jsonError("Unauthorized", 401);
  const projects = await prisma.portfolioProject.findMany({
    where: { userId: sessionUser.id },
    orderBy: [{ featured: "desc" }, { updatedAt: "desc" }],
  });
  return jsonSuccess(projects);
}

export async function POST(request: Request) {
  const sessionUser = await requireApiUser();
  if (!sessionUser) return jsonError("Unauthorized", 401);
  const parsed = portfolioProjectSchema.safeParse(await readJson(request));
  if (!parsed.success) return jsonError("Invalid project", 422, parsed.error.flatten());

  const base = slugify(parsed.data.title) || `project-${Date.now()}`;
  let slug = base;
  let suffix = 1;
  while (await prisma.portfolioProject.findUnique({ where: { userId_slug: { userId: sessionUser.id, slug } } })) {
    slug = `${base}-${suffix++}`;
  }

  const project = await prisma.portfolioProject.create({
    data: { userId: sessionUser.id, slug, ...parsed.data, source: "MANUAL" },
  });
  await recordActivity(sessionUser.id, "PROJECT_ADDED", `Added portfolio project: ${project.title}`, { projectId: project.id });
  return jsonSuccess(project, 201);
}
