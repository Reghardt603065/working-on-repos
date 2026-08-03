export type NormalizedJob = {
  source: string;
  externalId: string;
  title: string;
  company: string;
  description: string;
  location?: string;
  jobType?: string;
  experienceLevel?: string;
  category?: string;
  salaryMin?: number;
  salaryMax?: number;
  currency?: string;
  applyUrl: string;
  sourceUrl?: string;
  remote: boolean;
  postedAt?: Date;
  expiresAt?: Date;
  rawData?: Record<string, unknown>;
};

export type JobSourceResult = {
  source: string;
  jobs: NormalizedJob[];
  error?: string;
};
