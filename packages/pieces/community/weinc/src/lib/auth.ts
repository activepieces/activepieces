import { PieceAuth } from '@activepieces/pieces-framework';
import { AuthenticationType, httpClient, HttpMethod } from '@activepieces/pieces-common';
import { WEINC_BASE_URL } from './common/client';

export const weincAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: `
To get your WeInc API key:

1. Sign in at https://my.we.inc.
2. Open your organization settings and go to **API Keys**.
3. Create a key and copy it. It starts with \`wk_\`.
`,
  required: true,
  validate: async ({ auth }) => {
    try {
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${WEINC_BASE_URL}/projects`,
        queryParams: { limit: '1' },
        authentication: { type: AuthenticationType.BEARER_TOKEN, token: auth },
      });
      return { valid: true };
    } catch {
      return { valid: false, error: 'Invalid API key. Check that you copied the full key starting with wk_.' };
    }
  },
});
