import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { jsonError, jsonSuccess, readJson } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";
import { registerSchema } from "@/lib/validation";
import { slugify } from "@/lib/utils";

function requestKey(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}

export async function POST(request: Request) {
  const limit = rateLimit(`register:${requestKey(request)}`, 5, 15 * 60_000);
  if (!limit.allowed) return jsonError("Too many registration attempts. Try again later.", 429);

  const body = await readJson(request);
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) return jsonError("Please correct the registration details", 422, parsed.error.flatten());

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) return jsonError("An account with this email already exists", 409);

  const base = slugify(parsed.data.name) || `graduate-${Date.now()}`;
  let username = base;
  let suffix = 1;
  while (await prisma.user.findUnique({ where: { username } })) {
    username = `${base}-${suffix++}`;
  }

  const passwordHash = await hash(parsed.data.password, 12);
  const user = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash,
      username,
      skills: parsed.data.skills,
      consentAcceptedAt: new Date(),
      notificationPreference: { create: {} },
      notifications: {
        create: {
          type: "SYSTEM",
          title: "Welcome to GradConnect",
          message: "Complete your profile, add a certification, and explore graduate opportunities.",
          link: "/profile",
        },
      },
    },
    select: { id: true, name: true, email: true, username: true },
  });

  return jsonSuccess(user, 201);
}
