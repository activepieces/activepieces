import { PieceAuth } from '@activepieces/pieces-framework';
import { zeroCodeKitApi } from './common/client';

export const zeroCodeKitAuth = PieceAuth.SecretText({
    displayName: 'API Key',
    description: `To get your API key:
1. Log in to your [0CodeKit](https://0codekit.com) account.
2. Open the **Account** tab. Your API key is shown there.
3. Copy the key and paste it here.`,
    required: true,
    validate: async ({ auth }) => {
        try {
            await zeroCodeKitApi.request({
                apiKey: auth,
                path: '/1saas/auth',
            });
            return { valid: true };
        } catch (error) {
            const status = zeroCodeKitApi.statusOf(error);
            if (status === 401 || status === 403) {
                return {
                    valid: false,
                    error: '0CodeKit rejected this API key. Copy it again from your 0CodeKit settings.',
                };
            }
            return {
                valid: false,
                error: `Could not reach 0CodeKit to check this key: ${zeroCodeKitApi.describe({
                    error,
                    fallback: 'unknown error',
                })}`,
            };
        }
    },
});
