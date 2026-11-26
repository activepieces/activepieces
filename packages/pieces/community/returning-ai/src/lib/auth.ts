import { PieceAuth } from '@activepieces/pieces-framework';

export const returningAiAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
  description: `To get your API key:
1. Open your community admin.
2. Go to **Settings > Integration > API Keys**.
3. Create a key and paste it here.`,
});
