import { PieceAuth } from '@activepieces/pieces-framework';

export const pixelpandaAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: 'PixelPanda API key from https://pixelpanda.ai/profile (starts with pk_live_)',
  required: true,
});
