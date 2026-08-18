import { ingestJobs } from "@/lib/job-sources";
import { jsonError, jsonSuccess } from "@/lib/api";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV !== "production";
  const authorization = request.headers.get("authorization");
  return authorization === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) return jsonError("Unauthorized", 401);
  const summary = await ingestJobs();
  return jsonSuccess({ summary, completedAt: new Date().toISOString() });
}

export const POST = GET;
