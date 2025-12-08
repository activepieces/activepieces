import { PieceAuth } from '@activepieces/pieces-framework';

export const synthesiaAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description:
    'Your Synthesia API Key. You can get it from your Synthesia account.',
  required: true,
});
