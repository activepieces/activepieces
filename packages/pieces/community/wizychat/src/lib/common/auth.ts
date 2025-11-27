import { PieceAuth } from '@activepieces/pieces-framework';

export const wizychatAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: 'Wizychat API Key',
  required: true,
});
