import { auth } from "@/auth";

export function jsonError(message: string, status = 400, details?: unknown) {
  return Response.json({ ok: false, error: message, details }, { status });
}

export function jsonSuccess<T>(data: T, status = 200) {
  return Response.json({ ok: true, data }, { status });
}

export async function requireApiUser() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return session.user;
}

export async function readJson(request: Request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}
