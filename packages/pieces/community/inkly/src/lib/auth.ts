import { isPieceServerContextError, PieceAuth } from '@activepieces/pieces-framework';
import { inklyClient } from './common/client';

export const inklyAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: `The Inkly API needs an Inkly Pro or Teams plan.

To get your API key:
1. Sign in to Inkly and open [Account → API](https://www.inkly.so/account/api).
2. Click **Create API key** and give it a name. Choose **Read and send** to send documents, or **Read** if you only use the triggers.
3. Copy the key (Inkly shows it only once) and paste it here.`,
  required: true,
  validate: async ({ auth }) => {
    try {
      await inklyClient.getAccount({ apiKey: auth });
      return { valid: true };
    } catch (error) {
      if (isPieceServerContextError(error)) {
        throw error;
      }
      return { valid: false, error: error instanceof Error ? error.message : 'Could not reach Inkly to check this key.' };
    }
  },
  getConnectionIdentifier: async ({ auth }) => {
    try {
      const account = await inklyClient.getAccount({ apiKey: auth });
      return account.workspace.name;
    } catch {
      return undefined;
    }
  },
});
