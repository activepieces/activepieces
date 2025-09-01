import { PieceAuth } from '@activepieces/pieces-framework';

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
    
    For custom/dedicated instances, use your specific endpoint URL.
    `,
    props: {
        apiToken: PieceAuth.SecretText({
            displayName: 'API Token',
            description: 'Your Browserless API token (found in your dashboard)',
            required: true,
        }),
        baseUrl: PieceAuth.SecretText({
            displayName: 'Base URL',
            description: 'Your Browserless API endpoint. Use one of: https://production-sfo.browserless.io (US West), https://production-lon.browserless.io (Europe UK), https://production-ams.browserless.io (Europe Amsterdam), or your custom endpoint',
            required: true,
        }),
    },
    required: true,
});
