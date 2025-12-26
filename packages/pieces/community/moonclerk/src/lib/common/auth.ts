import { PieceAuth } from '@activepieces/pieces-framework';

export const moonclerkAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description:
    'Your Moonclerk API Key. You can find it in your Moonclerk account settings. (https://app.moonclerk.com/settings/api-key)',
  required: true,
});
