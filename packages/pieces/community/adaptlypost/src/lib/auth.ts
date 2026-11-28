import { HttpMethod } from '@activepieces/pieces-common';
import { PieceAuth } from '@activepieces/pieces-framework';
import { adaptlyPostClient } from './common/client';

type MeResponse = {
  tokenName: string | null;
  role: { name: string };
  workspace: { id: string };
};

export const adaptlyPostAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: `To get your API key:
1. Sign in to [AdaptlyPost](https://app.adaptlypost.com).
2. Open **Settings → API tokens** ([app.adaptlypost.com/api-tokens](https://app.adaptlypost.com/api-tokens)).
3. Click **Create token**, pick a role (Editor can create, schedule and publish posts) and copy the key. It starts with \`adaptly_\`.`,
  required: true,
  validate: async ({ auth }) => {
    try {
      await adaptlyPostClient.request<MeResponse>({
        apiKey: auth,
        method: HttpMethod.GET,
        path: '/me',
      });
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
      const me = await adaptlyPostClient.request<MeResponse>({
        apiKey: auth,
        method: HttpMethod.GET,
        path: '/me',
      });
      return me.tokenName ? `${me.tokenName} (${me.role.name})` : undefined;
    } catch {
      return undefined;
    }
  },
});
