import {
  AuthenticationType,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';

export const KLAVIYO_API_URL = 'https://a.klaviyo.com/api';
export const KLAVIYO_API_REVISION = '2024-10-15';

export async function klaviyoApiRequest<T>(
  apiKey: string,
  method: HttpMethod,
  path: string,
  body?: unknown,
): Promise<T> {
  const response = await httpClient.sendRequest<T>({
    method,
    url: `${KLAVIYO_API_URL}${path}`,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: apiKey,
    },
    headers: {
      'Content-Type': 'application/vnd.api+json',
      Accept: 'application/vnd.api+json',
      revision: KLAVIYO_API_REVISION,
    },
    body,
  });
  return response.body;
}

export async function listListsForDropdown(
  apiKey: string,
): Promise<Array<{ label: string; value: string }>> {
  const response = await klaviyoApiRequest<{
    data: Array<{
      id: string;
      attributes: { name: string };
    }>;
  }>(apiKey, HttpMethod.GET, '/lists');

  return response.data.map((list) => ({
    label: list.attributes.name,
    value: list.id,
  }));
}
