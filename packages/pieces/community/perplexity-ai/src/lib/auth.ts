import { PieceAuth } from '@activepieces/pieces-framework';

export const perplexityAiAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
  description: `To get your API key:
1. Open [API Keys](https://console.perplexity.ai/project/keys) in the Perplexity API Console.
2. Create a new key.
3. Copy the key and paste it here.`,
});
