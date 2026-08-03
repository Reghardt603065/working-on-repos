import type { Prisma } from "@/generated/prisma/client";

import { prisma } from "@/lib/prisma";
import { fetchAdzunaJobs } from "./adzuna";
import { fetchArbeitnowJobs } from "./arbeitnow";
import { fetchRemotiveJobs } from "./remotive";
import type { JobSourceResult } from "./types";

/**
 * Converts API response data into a JSON value Prisma can safely store.
 *
 * JSON.stringify also removes unsupported values such as undefined.
 */
function toPrismaJson(
  value: Record<string, unknown> | undefined,
): Prisma.InputJsonValue | undefined {
  if (!value) {
    return undefined;
  }

  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

export async function ingestJobs() {
  const results = await Promise.allSettled([
    fetchRemotiveJobs(),
    fetchArbeitnowJobs(),
    fetchAdzunaJobs(),
  ]);

  const sourceNames = ["Remotive", "Arbeitnow", "Adzuna"];

  const sourceResults: JobSourceResult[] = results.map((result, index) => {
    const source = sourceNames[index];

    if (result.status === "fulfilled") {
      return result.value;
    }

    return {
      source,
      jobs: [],
      error:
        result.reason instanceof Error
          ? result.reason.message
          : "Unknown error",
    };
  });

  const summary = [];

  for (const sourceResult of sourceResults) {
    const log = await prisma.jobFetchLog.create({
      data: {
        source: sourceResult.source,
        fetched: sourceResult.jobs.length,
        error: sourceResult.error,
      },
    });

    let inserted = 0;
    let updated = 0;
    let failed = 0;

    for (const job of sourceResult.jobs) {
      try {
        const existing = await prisma.jobListing.findUnique({
          where: {
            source_externalId: {
              source: job.source,
              externalId: job.externalId,
            },
          },
          select: {
            id: true,
          },
        });

        const rawData = toPrismaJson(job.rawData);

        await prisma.jobListing.upsert({
          where: {
            source_externalId: {
              source: job.source,
              externalId: job.externalId,
            },
          },

          create: {
            source: job.source,
            externalId: job.externalId,
            title: job.title,
            company: job.company,
            description: job.description,
            location: job.location,
            jobType: job.jobType,
            experienceLevel: job.experienceLevel,
            category: job.category,
            salaryMin: job.salaryMin,
            salaryMax: job.salaryMax,
            currency: job.currency,
            applyUrl: job.applyUrl,
            sourceUrl: job.sourceUrl,
            remote: job.remote,
            postedAt: job.postedAt,
            expiresAt: job.expiresAt,
            rawData,
          },

          update: {
            title: job.title,
            company: job.company,
            description: job.description,
            location: job.location,
            jobType: job.jobType,
            experienceLevel: job.experienceLevel,
            category: job.category,
            salaryMin: job.salaryMin,
            salaryMax: job.salaryMax,
            currency: job.currency,
            applyUrl: job.applyUrl,
            sourceUrl: job.sourceUrl,
            remote: job.remote,
            postedAt: job.postedAt,
            expiresAt: job.expiresAt,
            rawData,
          },
        });

        if (existing) {
          updated += 1;
        } else {
          inserted += 1;
        }
      } catch (error) {
        failed += 1;

        console.error(
          `Failed to save job from ${sourceResult.source}:`,
          error,
        );
      }
    }

    await prisma.jobFetchLog.update({
      where: {
        id: log.id,
      },
      data: {
        inserted,
        updated,
        failed,
        completedAt: new Date(),
      },
    });

    summary.push({
      source: sourceResult.source,
      fetched: sourceResult.jobs.length,
      inserted,
      updated,
      failed,
      warning: sourceResult.error,
    });
  }

  return summary;
}