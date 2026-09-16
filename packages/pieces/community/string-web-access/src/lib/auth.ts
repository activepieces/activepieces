import { PieceAuth } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from './common';

const markdownDescription = `
1. Create a free account at [portal.usestring.ai](https://portal.usestring.ai/sign-up) — the first 5,000 requests are free.
2. Open [Settings](https://portal.usestring.ai/settings) and copy an API key.
3. Paste the key here.
`;

export const stringWebAccessAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: markdownDescription,
  required: true,
  validate: async ({ auth }) => {
    try {
      await makeRequest(auth, HttpMethod.POST, '/fetch', {
        url: 'https://example.com',
        format: 'markdown',
      });

      return { valid: true };
    } catch (e) {
      return { valid: false, error: 'Invalid API Key.' };
    }
  },
});
