import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const search = searchParams.get("search")?.trim();
    const skill = searchParams.get("skill")?.trim();
    const free = searchParams.get("free");

    const certifications = await prisma.certificationListing.findMany({
      where: {
        ...(search
          ? {
              OR: [
                {
                  title: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
                {
                  provider: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
                {
                  description: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
              ],
            }
          : {}),

        ...(skill
          ? {
              skills: {
                has: skill,
              },
            }
          : {}),

        ...(free === "true"
          ? {
              isFree: true,
            }
          : {}),
      },

      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      items: certifications,
      total: certifications.length,
    });
  } catch (error) {
    console.error("Failed to load certification listings:", error);

    return NextResponse.json(
      {
        error: "Failed to load certification listings.",
      },
      {
        status: 500,
      }
    );
  }
}