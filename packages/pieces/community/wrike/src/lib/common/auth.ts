import { PieceAuth } from '@activepieces/pieces-framework';

export const wrikeAuth = PieceAuth.OAuth2({
    description: `
    To obtain your OAuth2 credentials:

    1. Go to Wrike (https://www.wrike.com/)
    2. Sign in to your account or create one
    3. Go to Apps & Integrations (https://www.wrike.com/apps/)
    4. Click "Create new app" or use an existing one
    5. For local development, add \`http://localhost:4200/redirect\` to the allowed redirect URIs
    6. For production, add \`https://cloud.activepieces.com/redirect\` to the allowed redirect URIs
    7. Copy the Client ID and Client Secret
    `,
    authUrl: 'https://login.wrike.com/oauth2/authorize/v4',
    tokenUrl: 'https://login.wrike.com/oauth2/token',
    required: true,
    scope: []
});
