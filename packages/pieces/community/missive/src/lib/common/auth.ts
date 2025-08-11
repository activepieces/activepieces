import { PieceAuth } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';

export const missiveAuth = PieceAuth.SecretText({
    displayName: 'API Token',
    required: true,
    description: `
    To get your API token:
    
    1. Go to your Missive preferences
    2. Click the API tab  
    3. Click "Create a new token"
    4. Copy the generated token (starts with 'missive_pat-')
    
    Note: You need to be part of an organization subscribed to the Productive plan to generate API tokens.
    `,
    validate: async ({ auth }) => {
        try {
            const response = await httpClient.sendRequest({
                method: HttpMethod.GET,
                url: 'https://public.missiveapp.com/v1/organizations',
                authentication: {
                    type: AuthenticationType.BEARER_TOKEN,
                    token: auth,
                }
            });

            if (response.status === 200) {
                return {
                    valid: true,
                };
            }

            return {
                valid: false,
                error: 'Invalid API token. Please check your token and try again.',
            };
        } catch (error) {
            return {
                valid: false,
                error: 'Failed to validate API token. Please check your token and try again.',
            };
        }
    }
}); 