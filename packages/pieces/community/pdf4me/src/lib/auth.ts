import { PieceAuth } from '@activepieces/pieces-framework';

export const pdf4meAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: `To get your PDF4me API key:
1. Go to your [API Keys dashboard](https://dev.pdf4me.com/dashboard/#/api-keys/)
2. Sign in or create a free account if you don't have one
3. Copy your API key and paste it here`,
  required: true,
});
