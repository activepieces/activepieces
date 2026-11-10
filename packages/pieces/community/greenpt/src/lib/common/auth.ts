import { PieceAuth } from '@activepieces/pieces-framework';

export const greenptAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description:
    'Create a key at https://account.greenpt.ai/api/keys (needs an active subscription).',
  required: true,
});
