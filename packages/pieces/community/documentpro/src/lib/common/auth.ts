import { PieceAuth, Property } from '@activepieces/pieces-framework';

export const documentproAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: 'API Key for DocumentPro',
  required: true,
});
