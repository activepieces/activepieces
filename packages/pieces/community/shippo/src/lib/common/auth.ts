import { PieceAuth } from '@activepieces/pieces-framework';

export const shippoAuth = PieceAuth.SecretText({
    displayName: 'API Key',
    description: `Your Shippo API Key.

To obtain your API Key:
1. Go to https://goshippo.com/
2. Sign up for an account
3. Go to Settings → API Keys
4. Generate a new API Key
5. Copy the Key and paste it here`,
    required: true,
});
