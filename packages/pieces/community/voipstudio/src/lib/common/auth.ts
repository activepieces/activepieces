import { PieceAuth } from '@activepieces/pieces-framework';

export const voipstudioAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: 'VoIPstudio API Key',
  required: true,
});
