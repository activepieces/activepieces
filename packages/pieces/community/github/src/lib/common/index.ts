import {
  AuthenticationType,
  httpClient,
  HttpMessageBody,
  HttpMethod,
  HttpRequest,
  HttpResponse,
  QueryParams,
} from '@activepieces/pieces-common';
import { Property, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { isNil } from '@activepieces/shared';

export const githubCommon = {
  baseUrl: 'https://api.github.com',
  repositoryDropdown: Property.Dropdown<{ repo: string; owner: string }>({
    displayName: 'Repository',
    refreshers: [],
    required: true,
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'please authenticate first',
        };
      }
      const authProp: OAuth2PropertyValue = auth as OAuth2PropertyValue;
      const repositories = await getUserRepo(authProp);
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
  assigneeDropDown: (required = false) =>
    Property.MultiSelectDropdown({
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
        const authProp: OAuth2PropertyValue = auth as OAuth2PropertyValue;
        const { owner, repo } = repository as RepositoryProp;
        const assignees = await getAssignee(authProp, owner, repo);
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
        const authProp: OAuth2PropertyValue = auth as OAuth2PropertyValue;
        const { owner, repo } = repository as RepositoryProp;
        const labels = await listIssueLabels(authProp, owner, repo);
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
  branchDropdown: (p0: boolean) =>
    Property.Dropdown<string>({
      displayName: 'Branch',
      description: 'Select a branch',
      required: true,
      refreshers: ['repository'],
      options: async ({ auth, repository }) => {
        if (!auth || !repository) {
          return {
            disabled: true,
            options: [],
            placeholder: 'please authenticate first and select repo',
          };
        }
        const authProp: OAuth2PropertyValue = auth as OAuth2PropertyValue;
        const { owner, repo } = repository as RepositoryProp;
        const branches = await getBranches(authProp, owner, repo);
        return {
          disabled: false,
          options: branches.map((branch) => ({
            label: branch.name,
            value: branch.name,
          })),
        };
      },
    }),
};

async function getUserRepo(authProp: OAuth2PropertyValue) {
  const response = await githubPaginatedApiCall<{
    id: number;
    name: string;
    owner: { login: string };
  }>({
    accessToken: authProp.access_token,
    method: HttpMethod.GET,
    resourceUri: '/user/repos',
  });
  return response;
}
async function getBranches(
  authProp: OAuth2PropertyValue,
  owner: string,
  repo: string
) {
  const response = await githubPaginatedApiCall<{ name: string }>({
    accessToken: authProp.access_token,
    method: HttpMethod.GET,
    resourceUri: `/repos/${owner}/${repo}/branches`,
  });
  return response;
}

async function getAssignee(
  authProp: OAuth2PropertyValue,
  owner: string,
  repo: string
) {
  const response = await githubPaginatedApiCall<{ id: number; login: string }>({
    accessToken: authProp.access_token,
    method: HttpMethod.GET,
    resourceUri: `/repos/${owner}/${repo}/assignees`,
  });
  return response;
}

async function listIssueLabels(
  authProp: OAuth2PropertyValue,
  owner: string,
  repo: string
) {
  const response = await githubPaginatedApiCall<{ id: number; name: string }>({
    accessToken: authProp.access_token,
    method: HttpMethod.GET,
    resourceUri: `/repos/${owner}/${repo}/labels`,
  });
  return response;
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
  accessToken: string;
  method: HttpMethod;
  resourceUri: string;
  query?: RequestParams;
  body?: any;
};

export async function githubApiCall<T extends HttpMessageBody>({
  accessToken,
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

  const request: HttpRequest = {
    method,
    url: baseUrl + resourceUri,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: accessToken,
    },
    queryParams: qs,
    body,
  };

  const response = await httpClient.sendRequest<T>(request);
  return response;
}

export async function githubPaginatedApiCall<T extends HttpMessageBody>({
  accessToken,
  method,
  resourceUri,
  query,
  body,
}: GithubApiCallParams): Promise<T[]> {
  const qs = query ? query : {};

  qs.page = 1;
  qs.per_page = 100;

  const resultData: T[] = [];
  let hasMoreItems = true;

  do {
    const response = await githubApiCall<T[]>({
      accessToken,
      method,
      resourceUri,
      query: qs,
      body,
    });
    qs.page = qs.page + 1;
    resultData.push(...response.body);
    const linkHeader = response.headers?.link;
    hasMoreItems = !isNil(linkHeader) && linkHeader.includes(`rel="next"`);
  } while (hasMoreItems);

  return resultData;
}
