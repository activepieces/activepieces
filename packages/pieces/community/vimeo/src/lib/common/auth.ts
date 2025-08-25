import { PieceAuth, Property } from '@activepieces/pieces-framework';

export const vimeoAuth = PieceAuth.SecretText({
    displayName: 'Access Token',
    description: 'Vimeo API access token. You can get this from your Vimeo Developer App settings.',
    required: true,
    validate: async ({ auth }) => {
        try {
            // Test the token by making a simple API call to get user info
            const response = await fetch('https://api.vimeo.com/me', {
                headers: {
                    'Authorization': `Bearer ${auth}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                return {
                    valid: true,
                };
            } else {
                return {
                    valid: false,
                    error: 'Invalid access token. Please check your Vimeo API credentials.',
                };
            }
        } catch (error) {
            return {
                valid: false,
                error: 'Failed to validate token. Please check your internet connection and try again.',
            };
        }
    }
});

export type VimeoAuthType = string; 