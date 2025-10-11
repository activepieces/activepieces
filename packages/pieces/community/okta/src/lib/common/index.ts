import {
  HttpMethod,
  HttpRequest,
  HttpResponse,
  AuthenticationType,
  httpClient,
  QueryParams,
} from '@activepieces/pieces-common';
import { Property } from '@activepieces/pieces-framework';

export interface OktaAuthValue {
  domain: string;
  apiToken: string;
}

export const oktaCommon = {
  baseUrl: (domain: string) => `https://${domain}`,
  
  userDropdown: Property.Dropdown({
    displayName: 'User',
    description: 'Select a user',
    required: true,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please authenticate first',
        };
      }
      const authValue = auth as OktaAuthValue;
      const users = await listUsers(authValue);
      return {
        disabled: false,
        options: users.map((user: any) => ({
          label: `${user.profile.firstName} ${user.profile.lastName} (${user.profile.email})`,
          value: user.id,
        })),
      };
    },
  }),

  groupDropdown: Property.Dropdown({
    displayName: 'Group',
    description: 'Select a group',
    required: true,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please authenticate first',
        };
      }
      const authValue = auth as OktaAuthValue;
      const groups = await listGroups(authValue);
      return {
        disabled: false,
        options: groups.map((group: any) => ({
          label: group.profile.name,
          value: group.id,
        })),
      };
    },
  }),
};

async function listUsers(auth: OktaAuthValue) {
  const response = await oktaApiCall({
    auth,
    method: HttpMethod.GET,
    resourceUri: '/api/v1/users',
    query: { limit: '200' },
  });
  return response.body as any[];
}

async function listGroups(auth: OktaAuthValue) {
  const response = await oktaApiCall({
    auth,
    method: HttpMethod.GET,
    resourceUri: '/api/v1/groups',
    query: { limit: '200' },
  });
  return response.body as any[];
}

export interface OktaApiCallParams {
  auth: OktaAuthValue;
  method: HttpMethod;
  resourceUri: string;
  query?: Record<string, string>;
  body?: any;
}

export async function oktaApiCall<T = any>({
  auth,
  method,
  resourceUri,
  query,
  body,
}: OktaApiCallParams): Promise<HttpResponse<T>> {
  const baseUrl = oktaCommon.baseUrl(auth.domain);
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
      token: auth.apiToken,
    },
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    queryParams: qs,
    body,
  };

  return await httpClient.sendRequest<T>(request);
}

