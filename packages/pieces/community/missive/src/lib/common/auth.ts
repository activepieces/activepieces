import { PieceAuth } from '@activepieces/pieces-framework';

export const missiveAuth = PieceAuth.OAuth2({
    description: `
    To obtain your OAuth2 credentials:
    
    1. Go to your Missive account settings
    2. Navigate to the API section
    3. Create a new API application
    4. Configure the redirect URI as: \`https://cloud.activepieces.com/redirect\`
    5. Copy the Client ID and Client Secret
    6. Select the required scopes for your integration
    `,
    authUrl: 'https://app.missiveapp.com/oauth/authorize',
    tokenUrl: 'https://app.missiveapp.com/oauth/token',
    required: true,
    scope: [
        'contacts.read',
        'contacts.write',
        'conversations.read',
        'conversations.write',
        'messages.read',
        'messages.write',
        'tasks.read',
        'tasks.write',
        'organizations.read',
        'teams.read',
        'users.read',
        'responses.read',
        'labels.read',
        'labels.write',
        'webhooks.read',
        'webhooks.write'
    ]
}); 