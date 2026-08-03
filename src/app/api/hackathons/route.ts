import { prisma } from "@/lib/prisma";
import { jsonError, jsonSuccess, requireApiUser } from "@/lib/api";

export async function GET(request: Request) {
  const sessionUser = await requireApiUser();
  if (!sessionUser) return jsonError("Unauthorized", 401);
  const q = new URL(request.url).searchParams.get("q")?.trim() || "";

  const hackathons = await prisma.hackathon.findMany({
    where: q
      ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { description: { contains: q, mode: "insensitive" } }] }
      : {},
    include: {
      participants: { where: { userId: sessionUser.id }, select: { id: true } },
      _count: { select: { participants: true, teams: true } },
    },
    orderBy: { startDate: "asc" },
  });
  return jsonSuccess(hackathons);
}
