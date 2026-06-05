import { PieceAuth } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { filetopdfApiCall } from './client';

const AUTH_DESCRIPTION = `Your FileToPDF API key (format \`sk_live_...\`).

Get one in seconds: open [filetopdf.dev](https://filetopdf.dev) and click **Get a free API key** on the home page for an instant trial key (no account, 10 free conversions), or create one in the [dashboard](https://filetopdf.dev).`;

export const filetopdfAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: AUTH_DESCRIPTION,
  required: true,
  validate: async ({ auth }) => {
    try {
      // GET /account is free and never rate-limited — the recommended connection test.
      await filetopdfApiCall({
        apiKey: auth as string,
        method: HttpMethod.GET,
        resourceUri: '/account',
      });
      return { valid: true };
    } catch (e) {
      return {
        valid: false,
        error: (e as Error).message || 'Invalid API Key.',
      };
    }
  },
});
