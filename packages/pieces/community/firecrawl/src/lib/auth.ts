import { PieceAuth } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { FIRECRAWL_API_BASE_URL } from './common/common';

const markdownDescription = `
Follow these steps to obtain your Firecrawl API Key:

1. Sign in or create an account at [Firecrawl](https://www.firecrawl.dev/app/api-keys?utm_source=activepieces&utm_medium=integration).
2. Copy your API key from the API Keys page.
`;

export const firecrawlAuth = PieceAuth.SecretText({
  description: markdownDescription,
  displayName: 'API Key',
  required: true,
  validate: async ({ auth }) => {
    try {
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${FIRECRAWL_API_BASE_URL}/team/credit-usage`,
        headers: {
          'Authorization': `Bearer ${auth}`,
        },
      });
      return {
        valid: true,
      };
    } catch (e) {
      return {
        valid: false,
        error: 'Invalid API Key',
      };
    }
  },
});
