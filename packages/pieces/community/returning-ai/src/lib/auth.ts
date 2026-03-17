import { PieceAuth } from '@activepieces/pieces-framework';

export const returningAiAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
  description: 'Add api key from returning.ai',
});
