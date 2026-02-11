import { PieceAuth } from '@activepieces/pieces-framework';

export const klaviyoAuth = PieceAuth.SecretText({
    displayName: 'Private API Key',
    description: 'Enter your Klaviyo Private API Key (found in Settings > API Keys)',
    required: true,
    validate: async ({ auth }) => {
        if (auth.startsWith('pk_')) {
            return {
                valid: true,
            };
        }
        return {
            valid: false,
            error: 'Invalid API Key. Klaviyo private keys usually start with "pk_".',
        };
    },
});
