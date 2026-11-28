import { AppConnectionType, PieceAuth, tryCatch } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { greipClient } from './common/client';

export const greipAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: `
To get your API Key:

1. Go to your Greip account dashboard
2. Navigate to API settings
3. Copy your API key
4. Paste it here
`,
  required: true,
  validate: async ({ auth }) => {
    if (!auth) {
      return {
        valid: false,
        error: 'API key is required',
      };
    }

    const { error } = await tryCatch(() =>
      greipClient.request({
        auth: { type: AppConnectionType.SECRET_TEXT, secret_text: auth },
        method: HttpMethod.GET,
        path: '/geo/ip',
      }),
    );

    if (error) {
      return {
        valid: false,
        error: 'Invalid API key. Please check your API key and try again.',
      };
    }

    return {
      valid: true,
    };
  },
});
