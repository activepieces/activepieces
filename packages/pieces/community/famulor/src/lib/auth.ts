import { PieceAuth } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { famulorApi } from './common/client';

export const famulorAuth = PieceAuth.SecretText({
  displayName: 'Workspace API Key',
  description: '1. Open https://app.famulor.io and select your workspace.\n2. Go to Settings → API & MCP.\n3. Create a workspace API key with the scopes your flow needs.\n4. Paste the key here. API Access must be included in your workspace plan.',
  required: true,
  validate: async ({ auth }) => {
    try {
      await famulorApi.request({ token: auth, method: HttpMethod.GET, path: '/me' });
      return { valid: true };
    } catch {
      return { valid: false, error: 'Could not connect to Famulor. Check your workspace API key and API Access.' };
    }
  },
});
