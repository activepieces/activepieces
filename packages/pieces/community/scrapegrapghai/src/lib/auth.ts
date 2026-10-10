import { AppConnectionType, PieceAuth, tryCatch } from '@activepieces/pieces-framework';
import { scrapegraphaiApi } from './common/api';

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
    const { error } = await tryCatch(() =>
      scrapegraphaiApi.validateApiKey({
        auth: { type: AppConnectionType.SECRET_TEXT, secret_text: auth },
      }),
    );
    return error ? { valid: false, error: 'Invalid API Key' } : { valid: true };
  },
});
