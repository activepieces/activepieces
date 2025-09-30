import { PieceAuth } from '@activepieces/pieces-framework';

export const productboardAuth = PieceAuth.SecretText({
    displayName: 'API Token',
    description: `Your Productboard API Token.

To obtain your API token:
1. Go to https://app.productboard.com/
2. Log in to your account
3. Go to Settings → Integrations → Public API
4. Generate a new API token
5. Copy the token and paste it here`,
    required: true,
});
