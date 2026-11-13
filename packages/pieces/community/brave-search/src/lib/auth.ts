import { PieceAuth } from '@activepieces/pieces-framework';

export const braveSearchAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
  description: `To get your API key:
1. Sign in to the [Brave Search API dashboard](https://api-dashboard.search.brave.com).
2. Open **API Keys** and copy your key.`,
});
