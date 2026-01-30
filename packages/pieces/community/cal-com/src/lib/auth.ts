import { PieceAuth } from '@activepieces/pieces-framework';

export const calcomAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: 'API Key provided by cal.com. Get it from Settings > Developer > API Keys',
  required: true,
});
