import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export const letmepostAuth = PieceAuth.CustomAuth({
  displayName: 'letmepost Connection',
  required: true,
  props: {
    base_url: Property.ShortText({
      displayName: 'Base URL',
      description:
        'The API base URL. Use `https://api.letmepost.dev` for the hosted service, or your own origin when self-hosting.',
      required: true,
      defaultValue: 'https://api.letmepost.dev',
    }),
    api_key: PieceAuth.SecretText({
      displayName: 'API Key',
      description: `Your letmepost API key (\`lmp_live_…\` or \`lmp_test_…\`). Create one in the dashboard under API keys.`,
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    try {
      const baseUrl = auth.base_url?.trim().replace(/\/+$/, '');
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${baseUrl}/v1/accounts`,
        headers: {
          Authorization: `Bearer ${auth.api_key}`,
        },
      });
      return { valid: true };
    } catch {
      return {
        valid: false,
        error: 'Invalid API key or base URL. Please check your credentials.',
      };
    }
  },
});

export type LetmepostAuth = {
  props: {
    base_url: string;
    api_key: string;
  };
};
