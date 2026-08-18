import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      title,
      provider,
      description,
      url,
      source,
      externalId,
      category,
      level,
      duration,
      cost,
      isFree,
      certificateType,
      skills,
    } = body;

    if (!title || !provider || !url || !source || !externalId) {
      return NextResponse.json(
        {
          error:
            "title, provider, url, source and externalId are required.",
        },
        { status: 400 }
      );
    }

    const certification = await prisma.certificationListing.upsert({
      where: {
        source_externalId: {
          source,
          externalId,
        },
      },

      create: {
        title,
        provider,
        description: description || null,
        url,
        source,
        externalId,
        category: category || null,
        level: level || null,
        duration: duration || null,
        cost: cost || null,
        isFree: Boolean(isFree),
        certificateType: certificateType || null,
        skills: Array.isArray(skills) ? skills : [],
      },

      update: {
        title,
        provider,
        description: description || null,
        url,
        category: category || null,
        level: level || null,
        duration: duration || null,
        cost: cost || null,
        isFree: Boolean(isFree),
        certificateType: certificateType || null,
        skills: Array.isArray(skills) ? skills : [],
        lastVerified: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      certification,
    });
  } catch (error) {
    console.error("Certification import failed:", error);

    return NextResponse.json(
      {
        error: "Failed to import certification.",
      },
      { status: 500 }
    );
  }
}