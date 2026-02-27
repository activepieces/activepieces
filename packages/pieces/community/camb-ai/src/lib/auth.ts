import { PieceAuth } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { API_BASE_URL } from './common';

export const cambaiAuth = PieceAuth.SecretText({
    displayName: "API Key",
    description: `
    To get your API key, please follow these steps:
    1. Log in to your [CAMB.AI Studio](https://camb.ai/studio/) account.
    2. Navigate to your workspace's API Keys dashboard.
    3. Create a new key if you haven't already.
    4. Copy the API key and paste it here.
    `,
    required: true,
    validate: async ({ auth }) => {
        try {
            await httpClient.sendRequest({
                method: HttpMethod.GET,
                url: `${API_BASE_URL}/source-languages`,
                headers: {
                    'x-api-key': auth,
                }
            });
            return {
                valid: true,
            };
        } catch (e) {
            return {
                valid: false,
                error: 'Invalid API Key.',
            };
        }
    }
});
