import { safeExternalUrl, slugify } from "@/lib/utils";

export type GitHubRepository = {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  homepage: string | null;
  description: string | null;
  fork: boolean;
  archived: boolean;
  language: string | null;
  topics?: string[];
  stargazers_count: number;
  pushed_at: string;
};

export async function fetchGitHubRepositories(username: string) {
  const cleanUsername = username.trim().replace(/[^a-zA-Z0-9-]/g, "");
  if (!cleanUsername) throw new Error("A GitHub username is required");

  const response = await fetch(
    `https://api.github.com/users/${encodeURIComponent(cleanUsername)}/repos?sort=pushed&per_page=50&type=owner`,
    {
      headers: {
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "GradConnect-Academic-Project",
      },
      next: { revalidate: 900 },
    },
  );

  if (!response.ok) {
    if (response.status === 404) throw new Error("GitHub user was not found");
    throw new Error(`GitHub API returned ${response.status}`);
  }

  const repos = (await response.json()) as GitHubRepository[];
  return repos
    .filter((repo) => !repo.fork && !repo.archived)
    .map((repo) => ({
      externalId: String(repo.id),
      title: repo.name.replace(/[-_]/g, " "),
      slug: slugify(repo.name),
      description: repo.description || `GitHub repository: ${repo.full_name}`,
      technologies: [repo.language, ...(repo.topics ?? [])].filter(Boolean) as string[],
      githubUrl: repo.html_url,
      liveUrl: safeExternalUrl(repo.homepage),
      featured: repo.stargazers_count > 0,
      pushedAt: new Date(repo.pushed_at),
    }));
}
