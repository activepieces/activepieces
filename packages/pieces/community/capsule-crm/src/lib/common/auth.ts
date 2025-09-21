import { PieceAuth } from '@activepieces/pieces-framework';

export const capsuleAuth = PieceAuth.OAuth2({
    description: `
    To obtain your OAuth2 credentials:

    1. Go to your Capsule CRM account settings at https://capsulecrm.com/user/myAccount
    2. Navigate to the "API & Webhooks" section
    3. Click on "OAuth2 Applications" to register a new application
    4. Fill in your application details (name, description, etc.)
    5. Set the redirect URI to: \`https://cloud.activepieces.com/redirect\`
    6. Choose the appropriate application type (web application recommended)
    7. Save the application and copy the Client ID and Client Secret

    The application will be granted "read write" scope by default, allowing full API access.
    `,
    authUrl: 'https://api.capsulecrm.com/oauth/authorise',
    tokenUrl: 'https://api.capsulecrm.com/oauth/token',
    required: true,
    scope: ['read write']
});
