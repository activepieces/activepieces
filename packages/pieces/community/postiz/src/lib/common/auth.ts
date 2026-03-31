import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export const postizAuth = PieceAuth.CustomAuth({
  displayName: 'Postiz Connection',
  required: true,
  props: {
    base_url: Property.ShortText({
      displayName: 'Base URL',
      description:
        'The API base URL. Use `https://api.postiz.com/public/v1` for Postiz Cloud, or `https://your-domain.com/api/public/v1` for self-hosted instances.',
      required: true,
      defaultValue: 'https://api.postiz.com/public/v1',
    }),
    api_key: PieceAuth.SecretText({
      displayName: 'API Key',
      description: `To get your API key:
1. Log in to your Postiz dashboard
2. Go to **Settings > Developers > Public API**
3. Generate a new API key and copy it`,
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    try {
      const baseUrl = auth.base_url?.trim().replace(/\/+$/, '');
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${baseUrl}/is-connected`,
        headers: {
          Authorization: auth.api_key,
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

export type PostizAuth = {
  props: {
    base_url: string;
    api_key: string;
  };
};
