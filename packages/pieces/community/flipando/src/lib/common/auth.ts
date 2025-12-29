import { PieceAuth } from '@activepieces/pieces-framework';

export const flipandoAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: 'Flipando API Key',
  required: true,
});
