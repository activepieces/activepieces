import { PieceAuth } from '@activepieces/pieces-framework';

export const kudosityAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: 'Kudosity API Key',
  required: true,
});
