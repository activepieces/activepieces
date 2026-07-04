import { PieceAuth } from '@activepieces/pieces-framework';

export const openPhoneAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
  description:
    'Enter your OpenPhone API key. You can generate one from the API tab in your workspace settings.',
});
