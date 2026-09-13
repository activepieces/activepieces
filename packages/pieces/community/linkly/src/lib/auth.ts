import { PieceAuth } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const LINKLY_API_BASE = 'https://api.linklyhq.com/api/v1';

const authDescription = `
To obtain your Linkly API key:
1. Sign in at [app.linklyhq.com](https://app.linklyhq.com)
2. Open **Settings** (gear icon) and choose **Workspace Settings**
3. Copy the value shown under **API Key**
4. Paste it here

The key gives access to every workspace your user belongs to. Docs: [linklyhq.com/support/api](https://linklyhq.com/support/api)
`;

export const linklyAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: authDescription,
  required: true,
  validate: async ({ auth }) => {
    try {
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${LINKLY_API_BASE}/workspaces`,
        headers: {
          Authorization: `Bearer ${auth.trim()}`,
          Accept: 'application/json',
        },
      });
      return { valid: true };
    } catch (e: unknown) {
      const status = readStatus(e);
      if (status === 401) {
        return {
          valid: false,
          error: 'Invalid API key. Copy it from Workspace Settings in app.linklyhq.com.',
        };
      }
      return {
        valid: false,
        error: 'Unable to reach the Linkly API. Please try again.',
      };
    }
  },
});

function readStatus(e: unknown): number | undefined {
  if (typeof e === 'object' && e !== null && 'response' in e) {
    const response = Reflect.get(e, 'response');
    if (typeof response === 'object' && response !== null && 'status' in response) {
      const status = Reflect.get(response, 'status');
      return typeof status === 'number' ? status : undefined;
    }
  }
  return undefined;
}
