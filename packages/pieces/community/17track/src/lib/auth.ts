import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { PieceAuth } from '@activepieces/pieces-framework';

const API_BASE = 'https://api.17track.net/track/v2.4';

export const seventeenTrackAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: 'Your 17TRACK API key (get or change it in 17TRACK API Settings)',
  required: true,
  validate: async ({ auth }: { auth: string }) => {
    try {
      await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: `${API_BASE}/getquota`,
        headers: { '17token': auth },
        body: [],
      });
      return { valid: true };
    } catch {
      return {
        valid: false,
        error: 'Invalid API key',
      };
    }
  },
});
