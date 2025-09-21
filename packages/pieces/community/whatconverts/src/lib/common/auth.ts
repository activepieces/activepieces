import { PieceAuth } from '@activepieces/pieces-framework';

export const whatconvertsAuth = PieceAuth.CustomAuth({
    description: `
    To obtain your WhatConverts API credentials:

    1. From your WhatConverts dashboard, navigate to an account then select a profile
    2. Select the Tracking dropdown and click "Integrations"
    3. Click on "API Keys" and generate a new API key
    4. Your API key will be in the format: token:secret
    5. Enter the full token:secret combination below
    `,
    props: {
        api_key: PieceAuth.SecretText({
            displayName: 'API Key',
            required: true,
            description: 'Your WhatConverts API key in token:secret format',
        }),
    },
    required: true,
});
