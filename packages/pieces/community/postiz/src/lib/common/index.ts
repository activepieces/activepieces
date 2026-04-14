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

async function fetchIntegrationOptions(auth: unknown) {
  if (!auth) {
    return {
      disabled: true,
      options: [] as { label: string; value: string }[],
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
}

export const postizCommon = {
  integrationDropdown: Property.Dropdown({
    displayName: 'Channel',
    description: 'Select the connected social media channel',
    refreshers: ['auth'],
    required: true,
    auth: postizAuth,
    options: fetchIntegrationOptions,
  }),
  integrationMultiSelect: Property.MultiSelectDropdown({
    displayName: 'Channels',
    description:
      'Only trigger for posts published on these channels. Leave empty to trigger for all channels.',
    refreshers: ['auth'],
    required: false,
    auth: postizAuth,
    options: fetchIntegrationOptions,
  }),
};

export type { PostizAuthValue } from './auth';
