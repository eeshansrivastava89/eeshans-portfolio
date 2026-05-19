import { fetchWithCache } from "./build-cache";

const GITHUB_USERNAME = "eeshansrivastava89";
const ACTIVITY_DAYS = 182;

export interface ContributionDay {
	date: string;
	contributionCount: number;
	color: string;
}

export interface ContributionWeek {
	contributionDays: ContributionDay[];
}

export interface RecentActivity {
	repo: string;
	message: string;
	time: string;
	url?: string;
	category: "commit" | "issue" | "pr" | "repo";
}

export interface ActivityTotals {
	commits: number;
	issues: number;
	prs: number;
	repos: number;
}

export interface GitHubData {
	followers: number;
	publicRepos: number;
	totalStars: number;
	totalContributions: number;
	weeks: ContributionWeek[];
	recentActivity: RecentActivity[];
	activityTotals: ActivityTotals;
}

const CONTRIBUTION_QUERY = `
query($username: String!, $activityFrom: DateTime!) {
  user(login: $username) {
    followers { totalCount }
    publicRepositories: repositories(privacy: PUBLIC) { totalCount }
    starsReceived: repositories(privacy: PUBLIC, first: 100, orderBy: {field: STARGAZERS, direction: DESC}) {
      nodes { stargazerCount }
    }
    contributionsCollection {
      contributionCalendar {
        totalContributions
        weeks {
          contributionDays {
            date
            contributionCount
            color
          }
        }
      }
    }
    recentActivity: contributionsCollection(from: $activityFrom) {
      totalCommitContributions
      totalIssueContributions
      totalPullRequestContributions
      totalRepositoryContributions
      commitContributionsByRepository(maxRepositories: 20) {
        repository { name url }
        contributions { totalCount }
      }
      issueContributions(first: 20, orderBy: {direction: DESC}) {
        nodes { issue { title url createdAt repository { name } } }
      }
      pullRequestContributions(first: 20, orderBy: {direction: DESC}) {
        nodes { pullRequest { title url createdAt repository { name } } }
      }
      repositoryContributions(first: 10, orderBy: {direction: DESC}) {
        nodes { repository { name url createdAt primaryLanguage { name } } }
      }
    }
  }
}
`;

async function fetchGitHubGraphQL(): Promise<GitHubData> {
	const token = import.meta.env.GITHUB_TOKEN || process.env.GITHUB_TOKEN;
	if (!token) throw new Error("GITHUB_TOKEN not available");

	const response = await fetch("https://api.github.com/graphql", {
		method: "POST",
		headers: {
			Authorization: `Bearer ${token}`,
			"Content-Type": "application/json",
			"User-Agent": "eeshans-portfolio",
		},
		body: JSON.stringify({
			query: CONTRIBUTION_QUERY,
			variables: {
				username: GITHUB_USERNAME,
				activityFrom: new Date(
					Date.now() - ACTIVITY_DAYS * 86400000,
				).toISOString(),
			},
		}),
	});

	if (!response.ok)
		throw new Error(`GitHub GraphQL failed: ${response.status}`);

	const json = await response.json();
	if (json.errors)
		throw new Error(
			`GitHub GraphQL errors: ${JSON.stringify(json.errors)}`,
		);

	const user = json.data.user;
	const calendar = user.contributionsCollection.contributionCalendar;

	return {
		followers: user.followers.totalCount,
		publicRepos: user.publicRepositories.totalCount,
		totalStars: user.starsReceived.nodes.reduce(
			(sum: number, repo: { stargazerCount: number }) => sum + repo.stargazerCount,
			0,
		),
		totalContributions: calendar.totalContributions,
		weeks: calendar.weeks,
		recentActivity: buildActivityFromGraphQL(user.recentActivity),
		activityTotals: {
			commits: user.recentActivity.totalCommitContributions,
			issues: user.recentActivity.totalIssueContributions,
			prs: user.recentActivity.totalPullRequestContributions,
			repos: user.recentActivity.totalRepositoryContributions,
		},
	};
}

interface GitHubActivityResponse {
	totalCommitContributions: number;
	totalIssueContributions: number;
	totalPullRequestContributions: number;
	totalRepositoryContributions: number;
	commitContributionsByRepository?: {
		repository?: { name?: string; url?: string };
		contributions?: { totalCount?: number };
	}[];
	issueContributions?: {
		nodes?: {
			issue?: {
				title?: string;
				url?: string;
				createdAt?: string;
				repository?: { name?: string };
			};
		}[];
	};
	pullRequestContributions?: {
		nodes?: {
			pullRequest?: {
				title?: string;
				url?: string;
				createdAt?: string;
				repository?: { name?: string };
			};
		}[];
	};
	repositoryContributions?: {
		nodes?: {
			repository?: {
				name?: string;
				url?: string;
				createdAt?: string;
				primaryLanguage?: { name?: string };
			};
		}[];
	};
}

function buildActivityFromGraphQL(
	contributions: GitHubActivityResponse,
): RecentActivity[] {
	const items: RecentActivity[] = [];
	const aggregateCommitTime = new Date().toISOString().slice(0, 10);

	for (const entry of contributions.commitContributionsByRepository || []) {
		const repo = entry.repository;
		const count = entry.contributions?.totalCount;
		if (repo?.name && repo.url && typeof count === "number" && count > 0) {
			items.push({
				repo: repo.name,
				message: `${count} commit${count !== 1 ? "s" : ""}`,
				time: aggregateCommitTime,
				url: repo.url,
				category: "commit",
			});
		}
	}

	for (const entry of contributions.repositoryContributions?.nodes || []) {
		const repo = entry.repository;
		if (repo?.name && repo.createdAt) {
			items.push({
				repo: repo.name,
				message: `Created repository${repo.primaryLanguage?.name ? ` · ${repo.primaryLanguage.name}` : ""}`,
				time: repo.createdAt,
				url: repo.url,
				category: "repo",
			});
		}
	}

	for (const entry of contributions.issueContributions?.nodes || []) {
		const issue = entry.issue;
		if (issue?.repository?.name && issue.title && issue.createdAt) {
			items.push({
				repo: issue.repository.name,
				message: `Opened issue: ${issue.title}`,
				time: issue.createdAt,
				url: issue.url,
				category: "issue",
			});
		}
	}

	for (const entry of contributions.pullRequestContributions?.nodes || []) {
		const pr = entry.pullRequest;
		if (pr?.repository?.name && pr.title && pr.createdAt) {
			items.push({
				repo: pr.repository.name,
				message: `Opened PR: ${pr.title}`,
				time: pr.createdAt,
				url: pr.url,
				category: "pr",
			});
		}
	}

	return items
		.sort(
			(a, b) => new Date(b.time).getTime() - new Date(a.time).getTime(),
		)
		.slice(0, 20);
}

function validateGitHubData(data: Partial<GitHubData>): GitHubData {
	if (typeof data.totalContributions !== "number")
		throw new Error("GitHub data missing totalContributions");
	if (!Array.isArray(data.weeks) || data.weeks.length === 0)
		throw new Error("GitHub data missing contribution weeks");
	if (!Array.isArray(data.recentActivity))
		throw new Error("GitHub data missing recentActivity");
	if (!data.activityTotals)
		throw new Error("GitHub data missing activityTotals");

	return data as GitHubData;
}

export async function getGitHubData(): Promise<GitHubData> {
	const data = await fetchWithCache<GitHubData>(
		"https://api.github.com/graphql",
		"github-data",
		fetchGitHubGraphQL,
	);
	return validateGitHubData(data);
}