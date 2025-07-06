import { PieceAuth } from '@activepieces/pieces-framework';
import { makeRequest } from '.';
import { HttpMethod } from '@activepieces/pieces-common';

export const airtopAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: `You can get your API key from [Airtop Dashboard](https://portal.airtop.ai/api-keys).`,
  required: true,
  validate: async ({ auth }) => {
    try {
      const apiKey = auth as string;
      await makeRequest(
        apiKey,
        HttpMethod.GET,
        '/sessions',
        undefined,
        undefined
      );
      return {
        valid: true,
      };
    } catch {
      return {
        valid: false,
        error: 'Invalid API Key.',
      };
    }
  },
});
