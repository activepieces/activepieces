import { PieceAuth } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { sardisApiCall } from './common';

export const sardisAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: `To get your Sardis API key:
1. Log in to your [Sardis Dashboard](https://sardis.sh/dashboard).
2. Navigate to **Settings** -> **API Keys**.
3. Copy your API key (starts with \`sk_\`).`,
  required: true,
  validate: async ({ auth }) => {
    try {
      await sardisApiCall(auth, HttpMethod.GET, '/api/v2/wallets');
      return { valid: true };
    } catch (e) {
      return {
        valid: false,
        error: 'Invalid API Key',
      };
    }
  },
});
