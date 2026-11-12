import { PieceAuth } from '@activepieces/pieces-framework';
import { genayaApi } from './common/client';

export const genayaAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: `To create a Genaya API key:
1. Sign in at **https://app.genaya.com**
2. Open **Settings > Developer > API keys**
3. Click **Create key** and copy the key (it is shown only once)

Use a live key (it starts with \`gny_live_\`). Test keys (\`gny_test_\`) can only read, so actions that create records and triggers that register a webhook need a live key. The API is available on the Individual plan and above. API reference: https://developer.genaya.com`,
  required: true,
  validate: async ({ auth }) => {
    try {
      await genayaApi.getOne<GenayaAccount>({ apiKey: auth, path: '/account' });
      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Invalid API key.',
      };
    }
  },
  getConnectionIdentifier: async ({ auth }) => {
    try {
      const account = await genayaApi.getOne<GenayaAccount>({ apiKey: auth, path: '/account' });
      return account.organizationName ?? undefined;
    } catch {
      return undefined;
    }
  },
});

type GenayaAccount = {
  organizationId?: string;
  organizationName?: string | null;
};
