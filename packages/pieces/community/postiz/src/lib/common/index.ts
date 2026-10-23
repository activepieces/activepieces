import {
  httpClient,
  HttpMethod,
  HttpMessageBody,
  HttpResponse,
} from '@activepieces/pieces-common';
import { Property } from '@activepieces/pieces-framework';
import { postizAuth, postizAuthHelpers, PostizAuthValue } from './auth';

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
    url: `${postizAuthHelpers.publicApiUrl(auth)}${path}`,
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
        auth,
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
