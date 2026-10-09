import { HttpError, HttpMethod } from '@activepieces/pieces-common';
import { PieceAuth } from '@activepieces/pieces-framework';
import { datacircleRequest } from './common';

export const datacircleAuth = PieceAuth.SecretText({
    displayName: 'API Key',
    description:
        'Your Datacircle API key. Sign up at [datacircle.dev](https://datacircle.dev) with your work email: the key comes with a $5 credit, and your [dashboard](https://datacircle.dev/app) shows it.',
    required: true,
    validate: async ({ auth }) => {
        try {
            await datacircleRequest<unknown>({
                apiKey: auth,
                method: HttpMethod.GET,
                path: '/balance/',
            });
            return { valid: true };
        } catch (error) {
            if (error instanceof HttpError && error.response.status === 401) {
                return {
                    valid: false,
                    error: 'Datacircle rejected this API key. Copy it again from your dashboard at https://datacircle.dev/app.',
                };
            }
            return {
                valid: false,
                error: 'Could not reach Datacircle to check this key. Try again in a minute.',
            };
        }
    },
});
