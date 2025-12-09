import { PieceAuth } from '@activepieces/pieces-framework';

export const easyPeasyAiAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description:
    'Easy Peasy AI API Key. Get it from https://easy-peasy-ai.com/account',
  required: true,
});
