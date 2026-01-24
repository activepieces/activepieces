import { PieceAuth } from '@activepieces/pieces-framework';

export const easyPeasyAiAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description:
    'Easy Peasy AI API Key. Get it from [Easy Peasy AI Settings](https://easy-peasy.ai/settings) - Navigate to the **API** tab from the top bar',
  required: true,
});
