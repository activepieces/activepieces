// src/lib/auth.ts
import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const twentyAuth = PieceAuth.CustomAuth({
  description: 'Connect to your Twenty instance',
  required: true,
  props: {
    base_url: Property.ShortText({
      displayName: 'Instance URL',
      description: 'The URL of your Twenty instance (e.g., https://app.twenty.com)',
      required: true,
    }),
    api_key: PieceAuth.SecretText({
      displayName: 'API Key',
      description: 'Your Twenty API Key',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
  
      const sanitizedUrl = auth.base_url.replace(/\/$/, '');
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${sanitizedUrl}/rest/people`,
        headers: {
          Authorization: `Bearer ${auth.api_key}`,
        },
        queryParams: {
          'page[size]': '1',
        },
      });
      return { valid: true };
   
    
  },
});