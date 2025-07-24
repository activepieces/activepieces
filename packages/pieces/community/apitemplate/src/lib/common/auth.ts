import { PieceAuth } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const apitemplateAuth = PieceAuth.CustomAuth({
  description: `To get your API Key:
  
  1. Sign up or log in to your [APITemplate.io](https://apitemplate.io) account
  2. Navigate to your Account Settings
  3. Copy your API Key from the API section
  
  Note: Keep your API key secure and do not share it publicly.`,
  props: {
    apiKey: PieceAuth.SecretText({
      displayName: 'API Key',
      description: 'Your APITemplate.io API key',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: 'https://rest.apitemplate.io/v1/list-templates',
        headers: {
          'X-API-KEY': auth.apiKey,
        },
      });
      
      if (response.status === 200) {
        return {
          valid: true,
        };
      }
      
      return {
        valid: false,
        error: 'Invalid API key',
      };
    } catch (error) {
      return {
        valid: false,
        error: 'Failed to validate API key',
      };
    }
  },
  required: true,
});