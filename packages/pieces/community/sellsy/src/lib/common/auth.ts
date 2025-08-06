import { PieceAuth } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from './client';

export const SellsyAccessToken = PieceAuth.SecretText({
  displayName: 'Access Token',
  description: 'Your Sellsy API access token',
  required: true,
});

export const sellsyAuth = PieceAuth.CustomAuth({
  description: `
  Please follow these steps to get your Sellsy API credentials:
  
  1. Log in to your Sellsy account.
  2. Go to Settings > API.
  3. Generate a new access token.
  4. Use the access token for authentication.`,
  props: {
    access_token: SellsyAccessToken,
  },
  validate: async ({ auth }) => {
    try {
      await makeRequest(
        { access_token: auth.access_token },
        HttpMethod.GET,
        '/people'
      );
      return { valid: true };
    } catch (e) {
      return {
        valid: false,
        error: 'Invalid access token',
      };
    }
  },
  required: true,
});

export const sellsyCommon = {
  baseUrl: 'https://api.sellsy.com/v2',
  auth: sellsyAuth,
};

export const createSellsyClient = (auth: { apiKey: string; companyId: string }) => {
  return {
    async makeRequest<T>(endpoint: string, method: HttpMethod = HttpMethod.GET, body?: any): Promise<T> {
      const response = await httpClient.sendRequest<T>({
        method,
        url: `${sellsyCommon.baseUrl}${endpoint}`,
        headers: {
          'Authorization': `Bearer ${auth.apiKey}`,
          'Content-Type': 'application/json',
        },
        body,
      });
      
      if (response.status >= 400) {
        throw new Error(`Sellsy API error: ${response.status} ${response.body}`);
      }
      
      return response.body;
    },
  };
}; 