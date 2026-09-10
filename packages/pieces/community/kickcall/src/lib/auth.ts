import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { KICKCALL_BASE_URL } from './common/constants';

export const kickcallAuth = PieceAuth.CustomAuth({
  description: `Connect Kickcall using your business API key and email.

1. Open your Kickcall dashboard.
2. Go to **Settings** and create or copy your API key.
3. Use the email address associated with your Kickcall business account.`,
  required: true,
  props: {
    apiKey: PieceAuth.SecretText({
      displayName: 'API Key',
      description: 'Your Kickcall business API key.',
      required: true,
    }),
    email: Property.ShortText({
      displayName: 'Business Email',
      description: 'Email address for your Kickcall business account.',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: `${KICKCALL_BASE_URL}/api/v1/public/api_keys/validate`,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: {
          api_key: auth.apiKey,
          email: auth.email,
        },
      });
      if (response.status === 200) {
        return { valid: true };
      }
      return {
        valid: false,
        error: `Kickcall returned status ${response.status}`,
      };
    } catch {
      return {
        valid: false,
        error: 'Invalid API key or email. Check your Kickcall credentials.',
      };
    }
  },
});
