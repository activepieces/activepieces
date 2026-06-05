import { PieceAuth } from '@activepieces/pieces-framework';
import { HttpError, HttpMethod } from '@activepieces/pieces-common';
import { addEventApi } from './common/client';

const markdownDescription = `
**Authenticate with your AddEvent API key.**

1. Sign in to your AddEvent account at https://dashboard.addevent.com.
2. Open **Account → Settings** (https://dashboard.addevent.com/account/settings).
3. Copy your **API key** and paste it below.

Note: API access requires a paid AddEvent plan — the free Hobby plan does not support the API.
`;

export const addEventAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: markdownDescription,
  required: true,
  validate: async ({ auth }) => {
    try {
      await addEventApi.call({
        apiKey: auth,
        method: HttpMethod.GET,
        resourceUri: '/calendars',
        query: { page_size: 1 },
      });
      return { valid: true };
    } catch (e) {
      if (e instanceof HttpError && e.response.status === 403) {
        return {
          valid: false,
          error:
            'This API key is valid, but your AddEvent plan does not allow API access. The free Hobby plan has no API access — upgrade your plan to use this integration.',
        };
      }
      return {
        valid: false,
        error:
          'Invalid API key. Please check the key in your AddEvent dashboard and try again.',
      };
    }
  },
});
