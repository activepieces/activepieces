import { Property, PieceAuth } from '@activepieces/pieces-framework';

export const systemeioAuth = PieceAuth.SecretText({
  displayName: 'Systeme.io API Key',
  description: 'Get your API key from your systeme.io account settings.',
  required: true,
}); 