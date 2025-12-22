import { PieceAuth } from '@activepieces/pieces-framework';

export const clearoutphoneAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: 'ClearoutPhone API Key',
  required: true,
});
