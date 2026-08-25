import {
  httpClient,
  HttpMessageBody,
  HttpMethod,
  HttpRequest,
  HttpResponse,
  QueryParams,
} from '@activepieces/pieces-common';
import { Property } from '@activepieces/pieces-framework';
import { isNil } from '@activepieces/pieces-framework';
import { githubAuth } from '../auth';
import { githubAuthHelpers, GithubAuthValue, isAppAuth } from './auth-helpers';

export const githubCommon = {
  baseUrl: 'https://api.github.com',
  repositoryDropdown: Property.Dropdown<
    { repo: string; owner: string },
    true,
    typeof githubAuth
  >({
    displayName: 'Repository',
    refreshers: [],
    auth: githubAuth,
    required: true,
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'please authenticate first',
        };
      }
      const repositories = await getUserRepo(auth);
      return {
        disabled: false,
        options: repositories.map((repo) => {
          return {
            label: repo.owner.login + '/' + repo.name,
            value: {
              owner: repo.owner.login,
              repo: repo.name,
            },
          };
        }),
      };
    },
  }),
  milestoneDropdown: (required = false) =>
    Property.Dropdown({
      auth: githubAuth,
      displayName: 'Milestone',
      description: 'The milestone to associate this issue with.',
      required,
      refreshers: ['repository'],
      options: async ({ auth, repository }) => {
        if (!auth || !repository) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please select a repository first',
          };
        }
        const { owner, repo } = repository as RepositoryProp;
        const milestones = await githubPaginatedApiCall<{
          number: number;
          title: string;
        }>({
          auth: auth as GithubAuthValue,
          method: HttpMethod.GET,
          resourceUri: `/repos/${owner}/${repo}/milestones`,
        });
        return {
          disabled: false,
          options: milestones.map((milestone) => {
            return {
              label: milestone.title,
              value: milestone.number,
            };
          }),
        };
      },
    }),
  branchDropdown: (displayName: string, desc: string, required = true) =>
    Property.Dropdown({
      auth: githubAuth,
      displayName,
      description: desc,
      required,
      refreshers: ['repository'],
      options: async ({ auth, repository }) => {
        if (!auth || !repository) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please select a repository first',
          };
        }
        const { owner, repo } = repository as RepositoryProp;
        const branches = await githubPaginatedApiCall<{ name: string }>({
          auth: auth as GithubAuthValue,
          method: HttpMethod.GET,
          resourceUri: `/repos/${owner}/${repo}/branches`,
        });
        return {
          disabled: false,
          options: branches.map((branch) => {
            return {
              label: branch.name,
              value: branch.name,
            };
          }),
        };
      },
    }),

  issueDropdown: (required = true) =>
    Property.Dropdown({
      auth: githubAuth,
      displayName: 'Issue',
      description: 'The issue to select.',
      required,
      refreshers: ['repository'],
      options: async ({ auth, repository }) => {
        if (!auth || !repository) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please select a repository first',
          };
        }
        const { owner, repo } = repository as RepositoryProp;
        const issues = await githubPaginatedApiCall<{
          number: number;
          title: string;
          pull_request?: Record<string, any>;
        }>({
          auth: auth as GithubAuthValue,
          method: HttpMethod.GET,
          resourceUri: `/repos/${owner}/${repo}/issues`,
          query: {
            state: 'open',
          },
        });
        return {
          disabled: false,
          options: issues
            .filter((issue) => !issue.pull_request)
            .map((issue) => {
              return {
                label: `#${issue.number} - ${issue.title}`,
                value: issue.number,
              };
            }),
        };
      },
    }),

  assigneeSingleDropdown: (required = false) =>
    Property.Dropdown({
      auth: githubAuth,
      displayName: 'Assignee',
      description: 'Filter issues by a specific assignee.',
      required,
      refreshers: ['repository'],
      options: async ({ auth, repository }) => {
        if (!auth || !repository) {
          return {
            disabled: true,
            options: [],
            placeholder: 'please authenticate first and select repo',
          };
        }
        const { owner, repo } = repository as RepositoryProp;
        const assignees = await getAssignee(auth, owner, repo);
        return {
          disabled: false,
          options: assignees.map((assignee) => {
            return {
              label: assignee.login,
              value: assignee.login,
            };
          }),
        };
      },
    }),

  assigneeDropDown: (required = false) =>
    Property.MultiSelectDropdown({
      auth: githubAuth,
      displayName: 'Assignees',
      description: 'Assignees for the Issue',
      refreshers: ['repository'],

      required,
      options: async ({ auth, repository }) => {
        if (!auth || !repository) {
          return {
            disabled: true,
            options: [],
            placeholder: 'please authenticate first and select repo',
          };
        }
        const { owner, repo } = repository as RepositoryProp;
        const assignees = await getAssignee(auth, owner, repo);
        return {
          disabled: false,
          options: assignees.map((assignee) => {
            return {
              label: assignee.login,
              value: assignee.login,
            };
          }),
        };
      },
    }),
  labelDropDown: (required = false) =>
    Property.MultiSelectDropdown({
      auth: githubAuth,
      displayName: 'Labels',
      description: 'Labels for the Issue',
      refreshers: ['repository'],
      required,
      options: async ({ auth, repository }) => {
        if (!auth || !repository) {
          return {
            disabled: true,
            options: [],
            placeholder: 'please authenticate first and select repo',
          };
        }
        const { owner, repo } = repository as RepositoryProp;
        const labels = await listIssueLabels(auth, owner, repo);
        return {
          disabled: false,
          options: labels.map((label) => {
            return {
              label: label.name,
              value: label.name,
            };
          }),
        };
      },
    }),
  workflowDropdown: ({
    description = 'The workflow to select.',
    required = false,
  }: { description?: string; required?: boolean } = {}) =>
    Property.Dropdown<{ id: number; path: string }, boolean, typeof githubAuth>(
      {
        auth: githubAuth,
        displayName: 'Workflow',
        description,
        required,
        refreshers: ['repository'],
        options: async ({ auth, repository }) => {
          if (!auth || !repository) {
            return {
              disabled: true,
              options: [],
              placeholder: 'Please select a repository first',
            };
          }
          const { owner, repo } = repository as RepositoryProp;
          const workflows = await getWorkflows(
            auth as GithubAuthValue,
            owner,
            repo
          );
          return {
            disabled: false,
            options: workflows.map((workflow) => {
              return {
                label: `${workflow.name} (${workflow.path})`,
                value: { id: workflow.id, path: workflow.path },
              };
            }),
          };
        },
      }
    ),
  refDropdown: ({
    displayName,
    description,
    required = false,
    include = ['branches', 'tags'],
  }: {
    displayName?: string;
    description?: string;
    required?: boolean;
    include?: ('branches' | 'tags')[];
  } = {}) => {
    const includesBranches = include.includes('branches');
    const includesTags = include.includes('tags');
    const refLabel =
      includesBranches && includesTags
        ? 'Branch or Tag'
        : includesBranches
        ? 'Branch'
        : 'Tag';

    return Property.Dropdown({
      auth: githubAuth,
      displayName: displayName ?? refLabel,
      description:
        description ??
        `The ${refLabel.toLowerCase()} to select.${
          includesBranches && includesTags
            ? ' If a branch and a tag share the same name, GitHub resolves the tag.'
            : ''
        }`,
      required,
      refreshers: ['repository'],
      options: async ({ auth, repository }) => {
        if (!auth || !repository) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please select a repository first',
          };
        }
        const { owner, repo } = repository as RepositoryProp;
        const [branches, tags] = await Promise.all([
          includesBranches
            ? githubPaginatedApiCall<{ name: string }>({
                auth: auth as GithubAuthValue,
                method: HttpMethod.GET,
                resourceUri: `/repos/${owner}/${repo}/branches`,
              })
            : [],
          includesTags
            ? githubPaginatedApiCall<{ name: string }>({
                auth: auth as GithubAuthValue,
                method: HttpMethod.GET,
                resourceUri: `/repos/${owner}/${repo}/tags`,
              })
            : [],
        ]);
        return {
          disabled: false,
          options: [
            ...branches.map((branch) => ({
              label: `${branch.name} (branch)`,
              value: branch.name,
            })),
            ...tags.map((tag) => ({
              label: `${tag.name} (tag)`,
              value: tag.name,
            })),
          ],
        };
      },
    });
  },
};

async function getUserRepo(auth: GithubAuthValue): Promise<RepoSummary[]> {
  if (isAppAuth(auth)) {
    return getInstallationRepos(auth);
  }
  return githubPaginatedApiCall<RepoSummary>({
    auth,
    method: HttpMethod.GET,
    resourceUri: '/user/repos',
  });
}

async function getInstallationRepos(
  auth: GithubAuthValue
): Promise<RepoSummary[]> {
  const repos: RepoSummary[] = [];
  const qs: RequestParams = { page: 1, per_page: 100 };
  while (true) {
    const response = await githubApiCall<{
      total_count: number;
      repositories: RepoSummary[];
    }>({
      auth,
      method: HttpMethod.GET,
      resourceUri: '/installation/repositories',
      query: qs,
    });
    repos.push(...response.body.repositories);
    const linkHeader = response.headers?.link;
    if (isNil(linkHeader) || !linkHeader.includes(`rel="next"`)) {
      break;
    }
    qs.page = (qs.page as number) + 1;
  }
  return repos;
}

async function getAssignee(auth: GithubAuthValue, owner: string, repo: string) {
  return githubPaginatedApiCall<{ id: number; login: string }>({
    auth,
    method: HttpMethod.GET,
    resourceUri: `/repos/${owner}/${repo}/assignees`,
  });
}

async function listIssueLabels(
  auth: GithubAuthValue,
  owner: string,
  repo: string
) {
  return githubPaginatedApiCall<{ id: number; name: string }>({
    auth,
    method: HttpMethod.GET,
    resourceUri: `/repos/${owner}/${repo}/labels`,
  });
}

async function getWorkflows(
  auth: GithubAuthValue,
  owner: string,
  repo: string
): Promise<WorkflowSummary[]> {
  return githubPaginatedApiCall<
    WorkflowSummary,
    { total_count: number; workflows: WorkflowSummary[] }
  >({
    auth,
    method: HttpMethod.GET,
    resourceUri: `/repos/${owner}/${repo}/actions/workflows`,
    extractItems: (body) => body.workflows,
  });
}

export async function getRepoEnvironments(
  auth: GithubAuthValue,
  owner: string,
  repo: string
): Promise<EnvironmentSummary[]> {
  return githubPaginatedApiCall<
    EnvironmentSummary,
    { total_count: number; environments: EnvironmentSummary[] }
  >({
    auth,
    method: HttpMethod.GET,
    resourceUri: `/repos/${owner}/${repo}/environments`,
    extractItems: (body) => body.environments,
  });
}

export async function getRepoFileContent(
  auth: GithubAuthValue,
  owner: string,
  repo: string,
  path: string,
  ref?: string
): Promise<string> {
  const response = await githubApiCall<{ content: string; encoding: string }>({
    auth,
    method: HttpMethod.GET,
    resourceUri: `/repos/${owner}/${repo}/contents/${path}`,
    query: ref ? { ref } : undefined,
  });
  if (response.body.encoding !== 'base64') {
    throw new Error(
      `Unexpected encoding "${response.body.encoding}" returned for ${path}`
    );
  }
  return Buffer.from(response.body.content, 'base64').toString('utf-8');
}

export async function getWorkflowRun(
  auth: GithubAuthValue,
  owner: string,
  repo: string,
  runId: number
): Promise<WorkflowRun> {
  const response = await githubApiCall<WorkflowRun>({
    auth,
    method: HttpMethod.GET,
    resourceUri: `/repos/${owner}/${repo}/actions/runs/${runId}`,
  });
  return response.body;
}

export async function githubApiCall<T extends HttpMessageBody>({
  auth,
  method,
  resourceUri,
  query,
  body,
}: GithubApiCallParams): Promise<HttpResponse<T>> {
  const baseUrl = 'https://api.github.com';
  const qs: QueryParams = {};

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== null && value !== undefined) {
        qs[key] = String(value);
      }
    }
  }

  const token = await githubAuthHelpers.getBearerToken(auth);

  const request: HttpRequest = {
    method,
    url: baseUrl + resourceUri,
    headers: {
      Authorization: `Bearer ${token}`,
    },
    queryParams: qs,
    body,
  };

  return httpClient.sendRequest<T>(request);
}

export async function githubPaginatedApiCall<
  T extends HttpMessageBody,
  R extends HttpMessageBody = T[]
>({
  auth,
  method,
  resourceUri,
  query,
  body,
  extractItems,
}: GithubApiCallParams & { extractItems?: (body: R) => T[] }): Promise<T[]> {
  const qs = query ? query : {};

  qs.page = 1;
  qs.per_page = 100;

  const resultData: T[] = [];
  let hasMoreItems = true;

  do {
    const response = await githubApiCall<R>({
      auth,
      method,
      resourceUri,
      query: qs,
      body,
    });
    qs.page = qs.page + 1;
    const items = extractItems
      ? extractItems(response.body)
      : (response.body as unknown as T[]);
    resultData.push(...items);
    const linkHeader = response.headers?.link;
    hasMoreItems = !isNil(linkHeader) && linkHeader.includes(`rel="next"`);
  } while (hasMoreItems);

  return resultData;
}

export interface RepositoryProp {
  repo: string;
  owner: string;
}

export type RequestParams = Record<
  string,
  string | number | string[] | undefined
>;

export type GithubApiCallParams = {
  auth: GithubAuthValue;
  method: HttpMethod;
  resourceUri: string;
  query?: RequestParams;
  body?: any;
};

type RepoSummary = {
  id: number;
  name: string;
  owner: { login: string };
};

type WorkflowSummary = {
  id: number;
  name: string;
  path: string;
  state: string;
};

type EnvironmentSummary = {
  id: number;
  name: string;
};

export type WorkflowRun = {
  id: number;
  status: string;
  conclusion: string | null;
  html_url: string;
  url: string;
  [key: string]: unknown;
};
