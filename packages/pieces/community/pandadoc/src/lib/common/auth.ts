import { PieceAuth } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const pandadocAuth = PieceAuth.CustomAuth({
  description: 'Enter your PandaDoc API key',
  required: true,
  props: {
    apiKey: PieceAuth.SecretText({
      displayName: 'API Key',
      description: 'Your PandaDoc API key. Get it from the Developer Dashboard in your PandaDoc account.',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: 'https://api.pandadoc.com/public/v1/documents',
        headers: {
          Authorization: `API-Key ${auth.apiKey}`,
        },
      });

      return {
        valid: true,
      };
    } catch (error: any) {
      return {
        valid: false,
        error: `Authentication failed: ${error?.response?.data?.detail || error.message}`,
      };
    }
  },
});

export type PandaDocAuthType = {
  apiKey: string;
};
