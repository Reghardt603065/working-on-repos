import { prisma } from "@/lib/prisma";
import { jsonError, jsonSuccess, requireApiUser } from "@/lib/api";

export async function GET(request: Request) {
  const sessionUser = await requireApiUser();
  if (!sessionUser) return jsonError("Unauthorized", 401);

  const url = new URL(request.url);
  const query = (url.searchParams.get("q") || "").trim();
  const location = (url.searchParams.get("location") || "").trim();
  const remote = url.searchParams.get("remote");
  const source = (url.searchParams.get("source") || "").trim();
  const page = Math.max(1, Number(url.searchParams.get("page") || 1));
  const pageSize = Math.min(50, Math.max(5, Number(url.searchParams.get("pageSize") || 20)));

  const where = {
    AND: [
      query
        ? {
            OR: [
              { title: { contains: query, mode: "insensitive" as const } },
              { company: { contains: query, mode: "insensitive" as const } },
              { description: { contains: query, mode: "insensitive" as const } },
            ],
          }
        : {},
      location ? { location: { contains: location, mode: "insensitive" as const } } : {},
      remote === "true" ? { remote: true } : {},
      source ? { source } : {},
    ],
  };

  const [jobs, total] = await Promise.all([
    prisma.jobListing.findMany({
      where,
      orderBy: [{ postedAt: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        savedBy: { where: { userId: sessionUser.id }, select: { id: true } },
        applications: { where: { userId: sessionUser.id }, select: { id: true, status: true } },
      },
    }),
    prisma.jobListing.count({ where }),
  ]);

  return jsonSuccess({ jobs, total, page, pageSize, pages: Math.ceil(total / pageSize) });
}
