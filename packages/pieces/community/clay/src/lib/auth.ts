import { PieceAuth } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { clayApiCall } from './common';

export const clayAuth = PieceAuth.SecretText({
    displayName: 'API Key',
    description:
        'Create a key from [Settings > Account > API keys (beta)](https://app.clay.com/workspaces/~/settings/account?accountTab=api-keys-beta), then paste it here.',
    required: true,
    validate: async ({ auth }) => {
        try {
            await clayApiCall({
                apiKey: auth,
                method: HttpMethod.GET,
                path: '/me',
            });
            return { valid: true };
        } catch (e) {
            return { valid: false, error: 'Invalid API key' };
        }
    },
});
