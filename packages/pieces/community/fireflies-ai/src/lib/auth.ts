import { PieceAuth } from '@activepieces/pieces-framework';
import { firefliesClient } from './common/client';
import { firefliesQueries } from './common/queries';

const markdownDescription = `
To use Fireflies.ai, you need an API key:
1. Log in to your account at https://app.fireflies.ai.
2. Open **Integrations** and click **Fireflies API**.
3. Copy your API key and paste it here.
`;

export const firefliesAiAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: markdownDescription,
  required: true,
  validate: async ({ auth }) => {
    try {
      const data = await firefliesClient.graphql({ apiKey: auth, query: firefliesQueries.validateUser, operation: 'connection check' });
      if (!firefliesClient.isRecord(data['user'])) {
        return { valid: false, error: 'Fireflies accepted the request but returned no user for this API key.' };
      }
      return { valid: true };
    } catch (error) {
      return { valid: false, error: error instanceof Error ? error.message : 'Fireflies connection check failed.' };
    }
  },
});
