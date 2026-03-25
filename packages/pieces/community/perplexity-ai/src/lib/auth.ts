import { PieceAuth } from '@activepieces/pieces-framework';

export const perplexityAiAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
  description: `
  Navigate to [API Settings](https://www.perplexity.ai/settings/api) and create new API key.
  `,
});
