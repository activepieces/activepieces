import { PieceAuth, Property } from '@activepieces/pieces-framework';

export const meetgeekaiAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: 'Meetgeek AI API Key',
  required: true,
});
