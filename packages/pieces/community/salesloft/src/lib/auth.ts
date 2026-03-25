import { PieceAuth } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

import { SALESLOFT_API_BASE } from './common/client';

export const salesloftAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: `
To obtain your Salesloft API key:
1. Log in to your Salesloft account
2. Navigate to **Settings → Integrations → API**
3. Click **Generate** to create a new API key
4. Copy the key and paste it here
  `,
  required: true,
  validate: async ({ auth }) => {
    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${SALESLOFT_API_BASE}/me`,
        headers: {
          Authorization: `Bearer ${auth}`,
        },
      });
      if (response.status === 200) {
        return { valid: true };
      }
      return {
        valid: false,
        error: 'Invalid API key — could not authenticate with Salesloft.',
      };
    } catch {
      return {
        valid: false,
        error: 'Invalid API key — could not authenticate with Salesloft.',
      };
    }
  },
});
