import { PieceAuth } from '@activepieces/pieces-framework';
import { HttpMethod, HttpMessageBody, HttpRequest, httpClient } from '@activepieces/pieces-common';

const BASE_URL = 'https://api.short.io'

export type ShortioApiCallParams = {
	apiKey: string;
	method: HttpMethod;
	resourceUri: string;
	body?: any;
};

export const shortioAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: `Enter your Short.io API key. You can get your API key from the [Short.io Dashboard](https://app.short.io/settings/integrations/api-key).
  
  **How to get your API key:**
  1. Go to the [Short.io Dashboard](https://app.short.io/settings/integrations/api-key)
  2. Sign in to your account
  3. Navigate to Integrations & API section and go to API tab
  4. Create a new API key or copy an existing one
  5. Paste the key here
  `,
  required: true,
  validate: async ({ auth }) => {
    try {
      const response = await shortioApiCall({
        apiKey: auth as string,
        method: HttpMethod.GET,
        resourceUri: '/links',
      });

      if (response && typeof response === 'object') {
        return { 
          valid: true,
          message: 'API key validated successfully. Connected to Short.io.' 
        };
      }

      return {
        valid: false,
        error: 'Invalid API response format. Please check your API key.',
      };
    } catch (error: any) {
      if (error.message.includes('Unauthorized')) {
        return {
          valid: false,
          error: 'Invalid API key. Please check your API key and try again.',
        };
      }

      return {
        valid: false,
        error: `API call failed: ${error.message}`,
      };
    }
  }

});

export async function shortioApiCall<T extends HttpMessageBody>({
  apiKey,
  method,
  resourceUri,
  body,
}: ShortioApiCallParams): Promise<T> {
  const request: HttpRequest = {
    method,
    url: BASE_URL + resourceUri,
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      Authorization: apiKey,
    },
    body
  }

  try {
    const response = await httpClient.sendRequest<T>(request);
    return response.body;
  } catch (error: any) {
    if (error.response?.status === 401) {
      throw new Error('Authentication failed. Please check your API key.');
    }
    throw new Error(`API call failed: ${error.message}`);
  }
}
