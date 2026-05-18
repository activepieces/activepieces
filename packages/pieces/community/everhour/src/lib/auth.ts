import { PieceAuth } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { everhourApiCall } from './common/client';

export const everhourAuth = PieceAuth.SecretText({
    displayName: 'API Key',
    description: `You can find your API key by going to **Settings -> API** in Everhour.`,
    required: true,
    validate: async ({ auth }) => {
        try {
            await everhourApiCall({
                apiKey: auth,
                method: HttpMethod.GET,
                resourceUri: '/users/me',
            });
            return { valid: true };
        } catch {
            return {
                valid: false,
                error: 'Invalid API Key.',
            };
        }
    },
});