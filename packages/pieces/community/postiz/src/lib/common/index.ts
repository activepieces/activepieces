import {
  httpClient,
  HttpMethod,
  HttpMessageBody,
  HttpResponse,
} from '@activepieces/pieces-common';
import { Property } from '@activepieces/pieces-framework';
import {
  postizAuth,
  PostizAuthValue,
  isApiKeyAuthentication,
} from './auth';

const DEFAULT_PUBLIC_API_URL = 'https://api.postiz.com/public/v1';

function buildPublicApiUrl(auth: PostizAuthValue): string {
  if (isApiKeyAuthentication(auth)) {
    const url = auth.props.base_url?.trim();
    if (!url) return DEFAULT_PUBLIC_API_URL;
    return url.replace(/\/+$/, '');
  }
  const url = auth.props.base_url?.trim().replace(/\/+$/, '');
  return `${url}/api/public/v1`;
}

function getApiKey(auth: PostizAuthValue): string {
  return auth.props.api_key;
}

export async function postizApiCall<T extends HttpMessageBody>({
  auth,
  method,
  path,
  body,
  queryParams,
}: {
  auth: PostizAuthValue;
  method: HttpMethod;
  path: string;
  body?: unknown;
  queryParams?: Record<string, string>;
}): Promise<HttpResponse<T>> {
  return await httpClient.sendRequest<T>({
    method,
    url: `${buildPublicApiUrl(auth)}${path}`,
    headers: {
      Authorization: getApiKey(auth),
    },
    queryParams,
    body,
  });
}

export const postizCommon = {
  integrationDropdown: Property.Dropdown({
    displayName: 'Channel',
    description: 'Select the connected social media channel',
    refreshers: ['auth'],
    required: true,
    auth: postizAuth,
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please connect your Postiz account first',
        };
      }
      const response = await postizApiCall<
        {
          id: string;
          name: string;
          identifier: string;
          profile: string;
        }[]
      >({
        auth: auth as PostizAuthValue,
        method: HttpMethod.GET,
        path: '/integrations',
      });
      return {
        disabled: false,
        options: response.body.map((integration) => ({
          label: `${integration.name} (${integration.identifier})`,
          value: integration.id,
        })),
      };
    },
  }),
};

export type { PostizAuthValue } from './auth';
