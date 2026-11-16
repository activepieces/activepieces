import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { Property } from '@activepieces/pieces-framework';

export const BASE_URL = 'https://wp-rapidapi.retentionstack.agency';

export async function apiRequest(apiKey: string, method: HttpMethod, path: string, body?: Record<string, unknown>) {
  const response = await httpClient.sendRequest({
    method,
    url: `${BASE_URL}${path}`,
    headers: { Authorization: `Bearer ${apiKey}` },
    body,
  });
  return response.body;
}

export const commonProps = {
  session: Property.ShortText({
    displayName: 'Session',
    description: 'Leave as "default" with a session token (ch_live_...). With an account key (ak_live_...), enter the session name.',
    required: true,
    defaultValue: 'default',
  }),
  chatId: Property.ShortText({
    displayName: 'To',
    description: 'Phone number with country code, digits only (e.g. 14155550123), or a group ID ending in @g.us.',
    required: true,
  }),
};
