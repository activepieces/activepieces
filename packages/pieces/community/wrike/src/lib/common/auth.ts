import { PieceAuth } from '@activepieces/pieces-framework';

export const wrikeAuth = PieceAuth.OAuth2({
    description: `
    To obtain your OAuth2 credentials:

    1. Go to Wrike (https://www.wrike.com/)
    2. Sign in to your account or create one
    3. Go to Apps & Integrations (https://www.wrike.com/apps/)
    4. Click "Create new app" or use an existing one
    5. Add \`https://cloud.activepieces.com/redirect\` to the allowed redirect URIs
    6. Select the required scopes for your integration (Default, wsReadOnly, wsReadWrite)
    7. Copy the Client ID and Client Secret
    `,
    authUrl: 'https://login.wrike.com/oauth2/authorize/v4',
    tokenUrl: 'https://login.wrike.com/oauth2/token',
    required: true,
    scope: ['Default', 'wsReadOnly', 'wsReadWrite']
});
