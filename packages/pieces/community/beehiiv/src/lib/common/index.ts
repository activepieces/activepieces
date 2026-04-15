import { HttpMethod, HttpRequest, httpClient } from '@activepieces/pieces-common';
import { PieceAuth, Property } from '@activepieces/pieces-framework';

export const beehiivAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: 'Go to your beehiiv Settings → Integrations → API to generate a key.',
  required: true,
  validate: async ({ auth }) => {
    try {
      const response = await beehiivApiCall({ apiKey: auth, method: HttpMethod.GET, resourceUri: '/publications' });
      return response.status === 200 ? { valid: true } : { valid: false, error: 'Invalid API Key' };
    } catch { return { valid: false, error: 'Invalid API Key' }; }
  },
});

export const BEEHIIV_BASE_URL = 'https://api.beehiiv.com/v2';

export async function beehiivApiCall<T>({ apiKey, method, resourceUri, body, queryParams }: any): Promise<{ status: number; body: T }> {
  const response = await httpClient.sendRequest<T>({
    method,
    url: `${BEEHIIV_BASE_URL}${resourceUri}`,
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body,
    queryParams,
  });
  return { status: response.status, body: response.body };
}

export const publicationIdDropdown = Property.Dropdown({
  displayName: 'Publication',
  required: true,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) return { disabled: true, options: [], placeholder: 'Enter API Key first' };
    const res = await beehiivApiCall<{ data: any[] }>({ apiKey: auth as string, method: HttpMethod.GET, resourceUri: '/publications' });
    return { disabled: false, options: res.body.data.map((p) => ({ label: p.name, value: p.id })) };
  },
});
