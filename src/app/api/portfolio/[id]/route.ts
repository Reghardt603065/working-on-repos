import { prisma } from "@/lib/prisma";
import { portfolioProjectSchema } from "@/lib/validation";
import { jsonError, jsonSuccess, readJson, requireApiUser } from "@/lib/api";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const sessionUser = await requireApiUser();
  if (!sessionUser) return jsonError("Unauthorized", 401);
  const { id } = await context.params;
  const parsed = portfolioProjectSchema.partial().safeParse(await readJson(request));
  if (!parsed.success) return jsonError("Invalid project update", 422, parsed.error.flatten());
  const existing = await prisma.portfolioProject.findFirst({ where: { id, userId: sessionUser.id } });
  if (!existing) return jsonError("Project not found", 404);
  const project = await prisma.portfolioProject.update({ where: { id }, data: parsed.data });
  return jsonSuccess(project);
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const sessionUser = await requireApiUser();
  if (!sessionUser) return jsonError("Unauthorized", 401);
  const { id } = await context.params;
  const result = await prisma.portfolioProject.deleteMany({ where: { id, userId: sessionUser.id } });
  if (!result.count) return jsonError("Project not found", 404);
  return jsonSuccess({ deleted: true });
}
