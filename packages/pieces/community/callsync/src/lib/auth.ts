import { PieceAuth } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { BASE_URL } from './common/client';

export const callsyncAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: `To get your API key:
1. Sign in to the [CallSync dashboard](https://dash.callsyncapp.com) as the workspace owner.
2. Open **API & Apps** and copy the API key.

Integrations must be on in an active CallSync plan.`,
  required: true,
  validate: async ({ auth }) => {
    try {
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${BASE_URL}/calls`,
        headers: { Authorization: `Bearer ${auth}` },
        queryParams: { limit: '1' },
      });
      return { valid: true };
    } catch {
      return {
        valid: false,
        error:
          'CallSync did not accept this API key. Copy it again from API & Apps in the CallSync dashboard.',
      };
    }
  },
});
