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
import { giteaAuth } from './auth';

export const giteaCommon = {
  baseUrl: (auth: OAuth2PropertyValue) => {
    const baseUrl = (auth.props?.['baseUrl'] as string) ?? 'https://gitea.com';
    return baseUrl.replace(/\/$/, '') + '/api/v1';
  },
  repositoryDropdown: Property.Dropdown<{ repo: string; owner: string }, true>({
    displayName: 'Repository',
    refreshers: [],
    auth: giteaAuth as any,
    required: true,
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please authenticate first',
        };
      }
      const authProp = auth as OAuth2PropertyValue;
      const repositories = await giteaPaginatedApiCall<GiteaRepository>({
        auth: authProp,
        method: HttpMethod.GET,
        resourceUri: '/user/repos',
      });
      return {
        disabled: false,
        options: repositories.map((repo) => {
          return {
            label: repo.full_name,
            value: {
              owner: repo.owner.login,
              repo: repo.name,
            },
          };
        }),
      };
    },
  }),
  branchDropdown: Property.Dropdown<string, false>({
    displayName: 'Branch',
    description: 'Filter by branch',
    required: false,
    refreshers: ['repository'],
    auth: giteaAuth as any,
    options: async ({ auth, repository }) => {
      if (!auth || !repository) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please select a repository first',
        };
      }
      const authProp = auth as OAuth2PropertyValue;
      const { owner, repo } = repository as { owner: string; repo: string };
      const branches = await giteaPaginatedApiCall<GiteaBranch>({
        auth: authProp,
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
};

export type GiteaRepository = {
  id: number;
  name: string;
  full_name: string;
  owner: { login: string };
};

export type GiteaBranch = {
  name: string;
};

export type GiteaApiCallParams = {
  auth: OAuth2PropertyValue;
  method: HttpMethod;
  resourceUri: string;
  query?: QueryParams;
  body?: any;
};

export async function giteaApiCall<T extends HttpMessageBody>({
  auth,
  method,
  resourceUri,
  query,
  body,
}: GiteaApiCallParams): Promise<HttpResponse<T>> {
  const baseUrl = giteaCommon.baseUrl(auth);
  const request: HttpRequest = {
    method,
    url: baseUrl + resourceUri,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: auth.access_token,
    },
    queryParams: query,
    body,
  };

  return await httpClient.sendRequest<T>(request);
}

export async function giteaPaginatedApiCall<T extends HttpMessageBody>({
  auth,
  method,
  resourceUri,
  query,
  body,
}: GiteaApiCallParams): Promise<T[]> {
  const qs = query ? { ...query } : {};
  qs['page'] = '1';
  qs['per_page'] = '100';

  const resultData: T[] = [];
  let hasMoreItems = true;

  while (hasMoreItems) {
    const response = await giteaApiCall<T[]>({
      auth,
      method,
      resourceUri,
      query: qs,
      body,
    });

    const data = response.body ?? [];

    resultData.push(...data);

    if (data.length < 100) {
      hasMoreItems = false;
    } else {
      qs['page'] = (parseInt(qs['page'] as string) + 1).toString();
    }
  }

  return resultData;
}

