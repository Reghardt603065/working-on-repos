import type {
  ActivityType,
  NotificationType,
  Prisma,
} from "@/generated/prisma/client";

import { prisma } from "@/lib/prisma";

export async function recordActivity(
  userId: string,
  type: ActivityType,
  message: string,
  metadata?: Prisma.InputJsonValue,
) {
  return prisma.activity.create({
    data: {
      userId,
      type,
      message,
      metadata,
    },
  });
}

export async function notifyUser(
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  link?: string,
) {
  return prisma.notification.create({
    data: {
      userId,
      type,
      title,
      message,
      link,
    },
  });
}