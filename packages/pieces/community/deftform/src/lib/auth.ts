import { PieceAuth } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';

export const deftformAuth = PieceAuth.SecretText({
    displayName: 'API Key',
    description: `To get your Deftform API key:
1. Log in to your Deftform workspace at https://deftform.com
2. Go to **Settings > API** (https://deftform.com/settings/api)
3. Click **Create API Key**
4. Copy the key and paste it here

Need help? See https://deftform.com/docs/api`,
    required: true,
    validate: async ({ auth }) => {
        try {
            await httpClient.sendRequest({
                method: HttpMethod.GET,
                url: 'https://deftform.com/api/v1/workspace',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                },
                authentication: {
                    type: AuthenticationType.BEARER_TOKEN,
                    token: auth,
                },
            });
            return { valid: true };
        } catch (e) {
            return { valid: false, error: 'Invalid API Key. Make sure you copied the full key from Deftform.' };
        }
    },
});
