import { cleanText, fetchJson, guessExperience } from "./http";
import type { JobSourceResult } from "./types";

type AdzunaResponse = {
  results: Array<{
    id: string;
    title: string;
    description: string;
    redirect_url: string;
    created?: string;
    salary_min?: number;
    salary_max?: number;
    company?: { display_name?: string };
    location?: { display_name?: string };
    category?: { label?: string };
    contract_type?: string;
  }>;
};

export async function fetchAdzunaJobs(): Promise<JobSourceResult> {
  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;
  const country = process.env.ADZUNA_COUNTRY || "za";

  if (!appId || !appKey) {
    return {
      source: "Adzuna",
      jobs: [],
      error: "Skipped because ADZUNA_APP_ID and ADZUNA_APP_KEY are not configured",
    };
  }

  try {
    const url = new URL(`https://api.adzuna.com/v1/api/jobs/${country}/search/1`);
    url.searchParams.set("app_id", appId);
    url.searchParams.set("app_key", appKey);
    url.searchParams.set("results_per_page", "50");
    url.searchParams.set("what", "software developer graduate junior intern");
    url.searchParams.set("content-type", "application/json");

    const payload = await fetchJson<AdzunaResponse>(url.toString());
    const jobs = payload.results.map((job) => {
      const description = cleanText(job.description);
      return {
        source: "Adzuna",
        externalId: String(job.id),
        title: cleanText(job.title),
        company: job.company?.display_name || "Unknown company",
        description,
        location: job.location?.display_name,
        jobType: job.contract_type,
        experienceLevel: guessExperience(job.title, description),
        category: job.category?.label,
        salaryMin: job.salary_min ? Math.round(job.salary_min) : undefined,
        salaryMax: job.salary_max ? Math.round(job.salary_max) : undefined,
        currency: country === "za" ? "ZAR" : undefined,
        applyUrl: job.redirect_url,
        sourceUrl: job.redirect_url,
        remote: /remote|work from home/i.test(`${job.title} ${job.description}`),
        postedAt: job.created ? new Date(job.created) : undefined,
        rawData: job as unknown as Record<string, unknown>,
      };
    });

    return { source: "Adzuna", jobs };
  } catch (error) {
    return { source: "Adzuna", jobs: [], error: error instanceof Error ? error.message : "Unknown error" };
  }
}
