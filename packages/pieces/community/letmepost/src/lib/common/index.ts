import {
  httpClient,
  HttpMethod,
  HttpMessageBody,
  HttpResponse,
} from '@activepieces/pieces-common';
import { Property } from '@activepieces/pieces-framework';
import { letmepostAuth, LetmepostAuth } from './auth';

const DEFAULT_BASE_URL = 'https://api.letmepost.dev';

function buildBaseUrl(auth: LetmepostAuth): string {
  const url = auth.props.base_url?.trim();
  if (!url) {
    return DEFAULT_BASE_URL;
  }
  return url.replace(/\/+$/, '');
}

export async function letmepostApiCall<T extends HttpMessageBody>({
  auth,
  method,
  path,
  body,
  queryParams,
  headers,
}: {
  auth: LetmepostAuth;
  method: HttpMethod;
  path: string;
  body?: unknown;
  queryParams?: Record<string, string>;
  headers?: Record<string, string>;
}): Promise<HttpResponse<T>> {
  return await httpClient.sendRequest<T>({
    method,
    url: `${buildBaseUrl(auth)}${path}`,
    headers: {
      Authorization: `Bearer ${auth.props.api_key}`,
      ...headers,
    },
    queryParams,
    body,
  });
}

type AccountListResponse = {
  data: {
    id: string;
    platform: string;
    displayName: string | null;
  }[];
};

export const letmepostCommon = {
  accountsDropdown: Property.MultiSelectDropdown({
    displayName: 'Accounts',
    description: 'The connected accounts to publish to',
    refreshers: ['auth'],
    required: true,
    auth: letmepostAuth,
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Connect your letmepost account first',
        };
      }
      const response = await letmepostApiCall<AccountListResponse>({
        auth: auth as LetmepostAuth,
        method: HttpMethod.GET,
        path: '/v1/accounts',
      });
      return {
        disabled: false,
        options: response.body.data.map((account) => ({
          label: `${account.displayName ?? account.platform} (${account.platform})`,
          value: account.id,
        })),
      };
    },
  }),
};

export type { LetmepostAuth } from './auth';
