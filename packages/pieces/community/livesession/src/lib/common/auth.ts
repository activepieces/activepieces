import { PieceAuth } from '@activepieces/pieces-framework';

export const livesessionAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: `r LiveSession API authentication.

**How to get your API Key:**
1. Go to [LiveSession settings](https://app.livesession.io/app/settings/api?tab=api_tokens)
2. Click **API Tokens** from the left menu
3. Click the creation button in the upper-right corner
4. Give your token a descriptive name
5. Select the website you want to access through the REST API
6. Select the scopes you'd like to grant this token e.g webhooks:read, webhooks:write, sessions:read, recordings:read etc.
7. Click confirm `,
  required: true,
});
