import { PieceAuth } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { FIRECRAWL_API_BASE_URL } from './common/common';

const markdownDescription = `
Follow these steps to obtain your Firecrawl API Key:

1. Visit [Firecrawl](https://firecrawl.dev) and create an account.
2. Log in and navigate to your dashboard.
3. Locate and copy your API key from the API settings section.
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
