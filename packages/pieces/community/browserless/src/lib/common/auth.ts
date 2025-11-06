import { PieceAuth, Property } from '@activepieces/pieces-framework';

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
            description: 'Enter your custom Browserless endpoint URL',
            required: false,
        }),
    },
    required: true,
});
