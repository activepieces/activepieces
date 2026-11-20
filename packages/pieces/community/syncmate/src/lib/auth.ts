import { PieceAuth } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { describeError, syncmateRequest } from './common/client';

/**
 * Only the API key is asked for: every call goes to the live gateway,
 * https://api.assistro.co (DEFAULT_BASE_URL). The client still honours a
 * `baseUrl` already present in the stored auth value, which is how the tests
 * and a local stack point the piece elsewhere; the form never offers it.
 */
export const syncmateAuth = PieceAuth.CustomAuth({
  displayName: 'SyncMate Connection',
  description: `Connect the WhatsApp number you use in SyncMate (Assistro).

1. Log in at [app.assistro.co](https://app.assistro.co) and pick the WhatsApp number you want to use.
2. Open **Apps → Activepieces** ([app.assistro.co/integrations/activepieces](https://app.assistro.co/integrations/activepieces)) and start the add-on.
3. Copy the API key from **API Configuration** and paste it below.`,
  required: true,
  props: {
    apiKey: PieceAuth.SecretText({
      displayName: 'API Key',
      description: 'The API key from Apps → Activepieces at app.assistro.co.',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    try {
      await syncmateRequest({ auth, method: HttpMethod.GET, path: '/v1/me' });
      return { valid: true };
    } catch (e) {
      return { valid: false, error: describeError(e) };
    }
  },
});
