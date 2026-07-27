import { PieceAuth } from '@activepieces/pieces-framework';

export const polotnoStudioAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: 'Your Polotno Studio project API key.',
  required: true,
});
