import { PieceAuth } from '@activepieces/pieces-framework';
import fetch from 'node-fetch';
export const facebookAuth = PieceAuth.SecretText({
    displayName: 'Page Access Token',
    description: 'Authenticate with Facebook Messenger using a Page Access Token',
    required: true,
    validate: async ({ auth }) => {
        try {
            console.log('Auth is:', auth);
            const response = await fetch(`https://graph.facebook.com/me?access_token=${auth}`);
             console.log('Response is:', response);
            if (response.ok) {
                return {
                    valid: true,
                };
            }

            return {
                valid: false,
                error: 'Invalid Page Access Token',
            };
        } catch (error) {
            return {
                valid: false,
                error: 'Error validating the token',
            };
        }
    },
});
