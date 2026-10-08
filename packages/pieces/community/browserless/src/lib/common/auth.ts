import { HttpMethod } from '@activepieces/pieces-common';
import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { browserlessApi } from './client';

export const browserlessAuth = PieceAuth.CustomAuth({
    description: `
    To obtain your API credentials:

    1. Sign up for a free Browserless account at https://www.browserless.io
    2. Navigate to your dashboard
    3. Find your API Key/Token in the account settings
    4. Choose your preferred regional endpoint for optimal performance

    Regional Endpoints:
    • US West (SFO): https://production-sfo.browserless.io
    • Europe UK (London): https://production-lon.browserless.io
    • Europe (Amsterdam): https://production-ams.browserless.io

    For custom/dedicated instances, select "Custom" and enter your specific endpoint URL.
    `,
    props: {
        apiToken: PieceAuth.SecretText({
            displayName: 'API Token',
            description: 'Your Browserless API token (found in your dashboard)',
            required: true,
        }),
        region: Property.StaticDropdown({
            displayName: 'Region',
            description: 'Choose the regional endpoint closest to you for optimal performance',
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
            description: 'Only for "Custom Endpoint": the address of your dedicated or self-hosted Browserless, for example https://chrome.browserless.io',
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
