import { PieceAuth } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from './client';

const markdownDescription = `
Follow these steps to obtain your Sofya API Key:

1. Visit [Sofya](https://sofya.co) and create an account (sign up with GitHub for 1,000 free credits per month on most accounts).
2. Open your [dashboard](https://sofya.co/dashboard).
3. Copy your API key (it starts with \`ay_live_\`).
`;

export const sofyaAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: markdownDescription,
  required: true,
  validate: async ({ auth }) => {
    try {
      await makeRequest({
        token: auth,
        method: HttpMethod.GET,
        path: '/auth/me',
      });
      return { valid: true };
    } catch (e) {
      const response = isRecord(e) ? e['response'] : undefined;
      const status =
        isRecord(response) && typeof response['status'] === 'number'
          ? response['status']
          : undefined;
      if (status === 401 || status === 403) {
        return { valid: false, error: 'Invalid API Key' };
      }
      return {
        valid: false,
        error: 'Could not connect to Sofya. Please try again.',
      };
    }
  },
});

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
