import { PieceAuth } from '@activepieces/pieces-framework';

export const teamworkAuth = PieceAuth.OAuth2({
    description: `
    To obtain your OAuth2 credentials:
    
    1. Go to your Teamwork site (https://yoursite.teamwork.com)
    2. Navigate to Settings > Apps & Integrations
    3. Click "Create App" or "Add Integration"
    4. Fill in the required information:
       - Name: Your integration name
       - Description: Brief description of your integration
    5. Configure OAuth settings:
       - Add \`https://cloud.activepieces.com/redirect\` to the allowed redirect URIs
       - Select required scopes for your integration
    6. Copy the Client ID and Client Secret from your app settings
    `,
    authUrl: 'https://www.teamwork.com/launchpad/login',
    tokenUrl: 'https://www.teamwork.com/launchpad/v1/token.json',
    required: true,
    scope: [
        'projects:read',
        'projects:write',
        'tasks:read', 
        'tasks:write',
        'people:read',
        'people:write',
        'companies:read',
        'companies:write',
        'time:read',
        'time:write',
        'expenses:read',
        'expenses:write',
        'invoices:read',
        'invoices:write',
        'files:read',
        'files:write',
        'messages:read',
        'messages:write',
        'notebooks:read',
        'notebooks:write'
    ]
});
