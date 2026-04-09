import {
  httpClient,
  HttpMethod,
  HttpMessageBody,
  HttpResponse,
} from '@activepieces/pieces-common';
import { Property } from '@activepieces/pieces-framework';
import { postizAuth, PostizAuth } from './auth';

const DEFAULT_BASE_URL = 'https://api.postiz.com/public/v1';

function buildBaseUrl(auth: PostizAuth): string {
  const url = auth.props.base_url?.trim();
  if (!url) {
    return DEFAULT_BASE_URL;
  }
  return url.replace(/\/+$/, '');
}

export async function postizApiCall<T extends HttpMessageBody>({
  auth,
  method,
  path,
  body,
  queryParams,
}: {
  auth: PostizAuth;
  method: HttpMethod;
  path: string;
  body?: unknown;
  queryParams?: Record<string, string>;
}): Promise<HttpResponse<T>> {
  return await httpClient.sendRequest<T>({
    method,
    url: `${buildBaseUrl(auth)}${path}`,
    headers: {
      Authorization: auth.props.api_key,
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
        auth: auth as PostizAuth,
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

export type { PostizAuth } from './auth';
