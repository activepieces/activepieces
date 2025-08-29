import { PieceAuth } from '@activepieces/pieces-framework';

const markdownDescription = `
To obtain your OAuth2 credentials for Wealthbox CRM:

1. Go to the [Wealthbox Developer Portal](https://developer.wealthbox.com/)
2. Sign in to your Wealthbox account
3. Create a new application or use an existing one
4. Configure the OAuth2 settings:
   - Add \`https://cloud.activepieces.com/redirect\` to the allowed redirect URIs
   - Set the required scopes for your integration
5. Copy the Client ID and Client Secret
`;

export const wealthboxAuth = PieceAuth.OAuth2({
  description: markdownDescription,
  authUrl: 'https://api.wealthbox.com/oauth/authorize',
  tokenUrl: 'https://api.wealthbox.com/oauth/token',
  required: true,
  scope: [
    'contacts.read',
    'contacts.write',
    'tasks.read',
    'tasks.write',
    'events.read',
    'events.write',
    'opportunities.read',
    'opportunities.write',
    'projects.read',
    'projects.write',
    'households.read',
    'households.write',
    'workflows.read',
    'workflows.write',
  ],
  async validate({ auth }) {
    try {
      // Test the authentication by making a simple API call
      const response = await fetch('https://api.wealthbox.com/v1/contacts', {
        headers: {
          'Authorization': `Bearer ${auth.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Authentication failed');
      }

      return {
        valid: true,
      };
    } catch (error) {
      return {
        valid: false,
        error: 'Invalid access token. Please check your credentials.',
      };
    }
  },
}); 