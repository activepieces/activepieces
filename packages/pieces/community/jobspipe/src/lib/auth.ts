import { PieceAuth } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export const jobspipeAuth = PieceAuth.SecretText({
    displayName: 'API Key',
    description:
        'Sign up at [JobsPipe](https://jobspipe.dev/signup) for 1,000 free credits, then copy your API key from the dashboard and paste it here.',
    required: true,
    validate: async ({ auth }) => {
        try {
            const response = await httpClient.sendRequest<{ user_id: string; email: string }>({
                method: HttpMethod.GET,
                url: 'https://api.jobspipe.dev/v1/account',
                headers: {
                    Authorization: `Bearer ${auth}`,
                },
            });

            if (response.status === 200 && response.body.user_id) {
                return { valid: true };
            }

            return { valid: false, error: 'Invalid API key' };
        } catch (error) {
            return { valid: false, error: 'Invalid API key' };
        }
    },
});
