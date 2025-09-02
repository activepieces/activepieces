import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getAccount = createAction({
  name: 'get_account',
  displayName: 'Get Account Information',
  description: 'Returns usage data like remaining API credits and account information',
  props: {},
  async run(context) {
    const apiKey = context.auth as string;

    if (!apiKey) {
      throw new Error('API key is required');
    }

    // Build query parameters
    const queryParams: Record<string, string> = {
      api_key: apiKey
    };

    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: 'https://api.webscraping.ai/account',
        queryParams
      });

      return response.body;
    } catch (error) {
      throw new Error(`WebScraping.AI API request failed: ${error}`);
    }
  }
});