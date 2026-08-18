import { prisma } from "@/lib/prisma";
import { messageSchema } from "@/lib/validation";
import { jsonError, jsonSuccess, readJson, requireApiUser } from "@/lib/api";
import { notifyUser } from "@/lib/activity";

export async function GET(request: Request) {
  const sessionUser = await requireApiUser();
  if (!sessionUser) return jsonError("Unauthorized", 401);
  const peerId = new URL(request.url).searchParams.get("peerId");

  const messages = await prisma.message.findMany({
    where: peerId
      ? {
          OR: [
            { senderId: sessionUser.id, receiverId: peerId },
            { senderId: peerId, receiverId: sessionUser.id },
          ],
        }
      : { OR: [{ senderId: sessionUser.id }, { receiverId: sessionUser.id }] },
    include: {
      sender: { select: { id: true, name: true, username: true } },
      receiver: { select: { id: true, name: true, username: true } },
    },
    orderBy: { createdAt: "asc" },
    take: 200,
  });
  return jsonSuccess(messages);
}

export async function POST(request: Request) {
  const sessionUser = await requireApiUser();
  if (!sessionUser) return jsonError("Unauthorized", 401);
  const parsed = messageSchema.safeParse(await readJson(request));
  if (!parsed.success) return jsonError("Invalid message", 422, parsed.error.flatten());

  const receiver = await prisma.user.findUnique({ where: { id: parsed.data.receiverId } });
  if (!receiver) return jsonError("Recipient not found", 404);

  const message = await prisma.message.create({
    data: { senderId: sessionUser.id, receiverId: parsed.data.receiverId, body: parsed.data.body },
  });
  await notifyUser(receiver.id, "MESSAGE", "New message", `${sessionUser.name || "A peer"} sent you a message.`, "/messages");
  return jsonSuccess(message, 201);
}
