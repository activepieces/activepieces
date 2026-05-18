import { PieceAuth } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';

// The base URL for the EmailOctopus API
const emailOctopusApiUrl = 'https://api.emailoctopus.com';

export const emailOctopusAuth = PieceAuth.SecretText({
    displayName: 'API Key',
    description: `
    To get your API key:
    1. Log in to your EmailOctopus account.
    2. Go to your **account settings**.
    3. Generate a new API key.
    **Note:** If you have a 'legacy' key, you must generate a new one for API v2.
    `,
    required: true,
    validate: async ({ auth }) => {
        try {
            await httpClient.sendRequest({
                method: HttpMethod.GET,
                url: `${emailOctopusApiUrl}/lists`,
                authentication: {
                    type: AuthenticationType.BEARER_TOKEN,
                    token: auth,
                },
            });
            return {
                valid: true,
            };
        } catch (e) {
            return {
                valid: false,
                error: 'Invalid API key.',
            };
        }
    },
});