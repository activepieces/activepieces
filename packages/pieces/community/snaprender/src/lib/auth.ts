import { HttpMethod } from '@activepieces/pieces-common';
import { PieceAuth } from '@activepieces/pieces-framework';
import { SnapRenderApiError, snaprenderApi } from './common/client';

export const snaprenderAuth = PieceAuth.SecretText({
    displayName: 'API Key',
    description: `To get your SnapRender API key:

1. Create a free account at https://app.snap-render.com/auth/signup (no credit card; the free plan includes 200 captures a month once you verify your email).
2. Copy the key shown on your dashboard after signup, or create a new one at https://app.snap-render.com/dashboard/keys
3. Paste the key here. It starts with \`sk_live_\`.`,
    required: true,
    validate: async ({ auth }) => {
        if (auth.trim() === '') {
            return { valid: false, error: 'Paste your SnapRender API key.' };
        }
        try {
            await snaprenderApi.request({ apiKey: auth, method: HttpMethod.GET, path: '/v1/usage', timeoutMs: 20_000 });
            return { valid: true };
        } catch (error) {
            if (error instanceof SnapRenderApiError && (error.status === 401 || error.status === 403)) {
                return {
                    valid: false,
                    error: 'Invalid API key. Copy it again from https://app.snap-render.com/dashboard/keys',
                };
            }
            return {
                valid: false,
                error: error instanceof Error ? error.message : 'Could not check the API key with SnapRender.',
            };
        }
    },
});
