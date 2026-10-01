import { PieceAuth } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

type AsanaUser = { email?: string; name?: string };

const labelOf = (user: AsanaUser | undefined): string | undefined =>
  user?.email || user?.name || undefined;

export const asanaAuth = PieceAuth.OAuth2({
  description: '',
  authUrl: 'https://app.asana.com/-/oauth_authorize',
  tokenUrl: 'https://app.asana.com/-/oauth_token',
  required: true,
  scope: ['default'],
  getConnectionIdentifier: async ({ auth }) => {
    const fromToken = labelOf(auth.data['data'] as AsanaUser | undefined);
    if (fromToken) {
      return fromToken;
    }
    try {
      const response = await httpClient.sendRequest<{ data?: AsanaUser }>({
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
