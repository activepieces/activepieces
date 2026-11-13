import { isPieceServerContextError, PieceAuth } from '@activepieces/pieces-framework';
import { datalabClient } from './common/client';

export const datalabAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: `To get your API key:
1. Sign in to Datalab and open [API Keys](https://www.datalab.to/app/keys).
2. Click **Create API key**.
3. Copy the key right away (Datalab shows it only once) and paste it here.`,
  required: true,
  validate: async ({ auth }) => {
    try {
      const check = await datalabClient.checkKey({ apiKey: auth });
      if (check === 'valid') {
        return { valid: true };
      }
      if (check === 'no_allowance') {
        return {
          valid: false,
          error: `Datalab knows this API key, but its free allowance or spend limit is used up. Add credit or raise the key's limit at ${datalabClient.KEYS_URL}, then connect again.`,
        };
      }
      return { valid: false, error: `Datalab rejected this API key. Create a new one at ${datalabClient.KEYS_URL} and paste it here.` };
    } catch (error) {
      if (isPieceServerContextError(error)) {
        throw error;
      }
      return { valid: false, error: `Could not reach Datalab to check this key: ${datalabClient.describeFailure(error)}` };
    }
  },
});
