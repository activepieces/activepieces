import { PieceAuth } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const asanaAuth = PieceAuth.OAuth2({
  description: '',
  authUrl: 'https://app.asana.com/-/oauth_authorize',
  tokenUrl: 'https://app.asana.com/-/oauth_token',
  required: true,
  scope: ['default'],
  getConnectionIdentifier: async ({ auth }) => {
    const fromToken = labelOf(auth.data['data']);
    if (fromToken) {
      return fromToken;
    }
    try {
      const response = await httpClient.sendRequest<{ data?: unknown }>({
        method: HttpMethod.GET,
        url: 'https://app.asana.com/api/1.0/users/me',
        queryParams: { opt_fields: 'email,name' },
        headers: { Authorization: `Bearer ${auth.access_token}` },
        timeout: 5000,
      });
      return labelOf(response.body.data);
    } catch {
      return undefined;
    }
  },
});

function labelOf(user: unknown): string | undefined {
  if (typeof user !== 'object' || user === null) {
    return undefined;
  }
  const email = 'email' in user && typeof user.email === 'string' ? user.email : '';
  const name = 'name' in user && typeof user.name === 'string' ? user.name : '';
  return email || name || undefined;
}
