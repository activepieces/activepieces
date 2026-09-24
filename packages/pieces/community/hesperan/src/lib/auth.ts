import { PieceAuth } from '@activepieces/pieces-framework';
import { hesperanApi } from './common/client';

export const hesperanAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: `To get your API key:
1. Sign in at https://hesperan.com/console.
2. Open **API keys** and create a key.
3. Copy the key (it starts with \`hsp_\`) and paste it here.

Checking the key is free: nothing is charged and no model call is made.`,
  required: true,
  validate: async ({ auth }) => hesperanApi.validateKey({ apiKey: auth }),
});
