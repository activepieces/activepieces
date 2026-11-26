import { PieceAuth } from '@activepieces/pieces-framework';
import { HumeClient } from 'hume';

export const humeAiAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: 'Copy your API key from [Settings → API Keys](https://platform.hume.ai/settings/keys) in the Hume portal.',
  required: true,
  validate: async ({ auth }) => {
    try {
      const client = new HumeClient({
        apiKey: auth as string,
      });

      await client.expressionMeasurement.batch.listJobs();

      return {
        valid: true,
      };
    } catch (error) {
      return {
        valid: false,
        error: 'Invalid API key. Please check your Hume AI API key.',
      };
    }
  },
});
