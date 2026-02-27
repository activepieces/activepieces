import { PieceAuth } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

const markdownDescription = `
Follow these steps to obtain your ScrapeGraphAI API Key:

1. Visit [ScrapeGraphAI](https://scrapegraphai.com) and create an account.
2. Log in and navigate to your dashboard.
3. Locate and copy your API key from the dashboard.
`;

export const scrapegraphaiAuth = PieceAuth.SecretText({
  description: markdownDescription,
  displayName: 'API Key',
  required: true,
  validate: async ({ auth }) => {
    try {
      await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: 'https://api.scrapegraphai.com/v1/smartscraper',
        headers: {
          'Content-Type': 'application/json',
          'SGAI-APIKEY': auth,
        },
        body: {
          user_prompt: 'test',
          website_url: 'https://www.example.com',
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
