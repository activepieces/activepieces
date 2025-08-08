import { PieceAuth } from '@activepieces/pieces-framework';

export const teamleaderAuth = PieceAuth.OAuth2({
    description: `
    To obtain your OAuth2 credentials:
    
    1. Go to the Teamleader Marketplace (https://marketplace.teamleader.eu)
    2. Log in or create an account
    3. Go to "Build" and click "Create a new Integration"
    4. Fill in the required information
    5. On your integration's settings page, configure:
       - Add \`https://cloud.activepieces.com/redirect\` to the allowed redirect URIs
       - Select all required scopes for your integration
    6. Copy the Client ID and Client Secret
    `,
    authUrl: 'https://focus.teamleader.eu/oauth2/authorize',
    tokenUrl: 'https://focus.teamleader.eu/oauth2/access_token',
    required: true,
    scope: [
    ]
});
