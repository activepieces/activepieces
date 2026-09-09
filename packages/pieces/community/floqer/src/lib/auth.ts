import { HttpMethod } from '@activepieces/pieces-common';
import { PieceAuth } from '@activepieces/pieces-framework';
import { floqerApi } from './common/client';
import { FloqerUser } from './common/types';

export const floqerAuth = PieceAuth.SecretText({
    displayName: 'API Key',
    description:
        'Your Floqer API key. It starts with `floq_`. Create one from your Floqer workspace settings.',
    required: true,
    validate: async ({ auth }) => {
        try {
            await floqerApi.enveloped<FloqerUser>({
                apiKey: auth,
                method: HttpMethod.GET,
                path: '/api/v1/user/',
            });
            return { valid: true };
        } catch (error) {
            const status = floqerApi.statusOf(error);
            if (status === 401 || status === 403) {
                return {
                    valid: false,
                    error: 'Floqer rejected this API key. Check that it is active and starts with "floq_".',
                };
            }
            return {
                valid: false,
                error: `Could not reach Floqer to check this key: ${floqerApi.describe(
                    error,
                    'unknown error',
                )}`,
            };
        }
    },
});
