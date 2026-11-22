import { HttpMethod } from '@activepieces/pieces-common';
import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { browserlessApi } from './client';

export const browserlessAuth = PieceAuth.CustomAuth({
    description: `Connect your Browserless account.

1. Sign up or log in at https://www.browserless.io.
2. Copy the API Token from your dashboard.
3. Pick the region your account uses, or Custom Endpoint for a dedicated or self-hosted instance.`,
    props: {
        apiToken: PieceAuth.SecretText({
            displayName: 'API Token',
            description: 'Copy it from your Browserless dashboard.',
            required: true,
        }),
        region: Property.StaticDropdown({
            displayName: 'Region',
            description: 'The Browserless region your account runs in.',
            required: true,
            options: {
                options: [
                    {
                        label: 'US West (San Francisco)',
                        value: 'https://production-sfo.browserless.io'
                    },
                    {
                        label: 'Europe UK (London)',
                        value: 'https://production-lon.browserless.io'
                    },
                    {
                        label: 'Europe (Amsterdam)',
                        value: 'https://production-ams.browserless.io'
                    },
                    {
                        label: 'Custom Endpoint',
                        value: 'custom'
                    }
                ]
            }
        }),
        customBaseUrl: Property.ShortText({
            displayName: 'Custom Base URL',
            description: 'Only for Custom Endpoint: your dedicated or self-hosted Browserless address.',
            placeholder: 'https://browserless.example.com',
            required: false,
        }),
    },
    required: true,
    validate: async ({ auth }) => {
        try {
            await browserlessApi.request({
                auth,
                method: HttpMethod.GET,
                path: '/meta',
                timeoutMs: 20_000,
                operation: 'Checking the connection',
            });
            return { valid: true };
        } catch (error) {
            const status = typeof error === 'object' && error !== null && 'status' in error ? error.status : null;
            if (status === 401 || status === 403) {
                return {
                    valid: false,
                    error: 'Invalid API token for this endpoint. Copy the token from your Browserless dashboard and pick the region your account uses (private-fleet tokens need the Custom Endpoint).',
                };
            }
            if (typeof status === 'number' && status !== 429 && status < 500) {
                return { valid: true };
            }
            return {
                valid: false,
                error: error instanceof Error ? error.message : 'Could not reach Browserless with these settings.',
            };
        }
    },
});
