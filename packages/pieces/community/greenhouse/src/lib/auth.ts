import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { PieceAuth } from '@activepieces/pieces-framework';

import { GREENHOUSE_BASE_URL, greenhouseBasicAuthHeader } from './common/client';

export const greenhouseAuth = PieceAuth.SecretText({
  displayName: 'Harvest API Key',
  description:
    'Greenhouse Harvest API key. Greenhouse uses HTTP Basic auth with the API key as the username and a blank password.',
  required: true,
  validate: async ({ auth }) => {
    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${GREENHOUSE_BASE_URL}/jobs`,
        queryParams: {
          per_page: '1',
          skip_count: 'true',
        },
        headers: {
          Authorization: greenhouseBasicAuthHeader(auth),
          Accept: 'application/json',
        },
      });

      if (response.status >= 200 && response.status < 300) {
        return { valid: true };
      }
    } catch {
      // ignore and return invalid below
    }

    return {
      valid: false,
      error:
        'Invalid Greenhouse Harvest API key. Confirm the key is enabled for the Harvest API and has access to jobs/candidates endpoints.',
    };
  },
});
