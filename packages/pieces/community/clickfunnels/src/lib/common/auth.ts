import { PieceAuth } from '@activepieces/pieces-framework';

export const clickfunnelsAuth = PieceAuth.OAuth2({
    description: 'To obtain your OAuth2 credentials: 1. Go to your ClickFunnels workspace settings 2. Navigate to Integrations > API 3. Click "Create New API Application" 4. Fill in the required information 5. Add the redirect URI: https://cloud.activepieces.com/redirect 6. Select the required scopes for your integration 7. Copy the Client ID and Client Secret from the created application',
    authUrl: 'https://{subdomain}.myclickfunnels.com/oauth/authorize',
    tokenUrl: 'https://{subdomain}.myclickfunnels.com/oauth/token',
    required: true,
    scope: ['teams:read', 'users:read', 'workspaces:read', 'contacts:read', 'contacts:write', 'orders:read', 'courses:read', 'courses:write', 'sales:read', 'sales:write']
});
