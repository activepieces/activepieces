import { PieceAuth } from '@activepieces/pieces-framework';

export const productboardAuth = PieceAuth.SecretText({
    displayName: 'API Key',
    description: `Your Productboard API Key.

To obtain your API Key:
1. Go to https://app.productboard.com/
2. Log in to your account
3. Go to Settings → Integrations → Public API
4. Generate a new API Key
5. Copy the Key and paste it here`,
    required: true,
});
