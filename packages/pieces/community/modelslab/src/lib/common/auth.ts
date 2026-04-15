import { PieceAuth } from '@activepieces/pieces-framework';

export const modelsLabAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: 'Get your API key at https://modelslab.com/account/api-key',
  required: true,
});
