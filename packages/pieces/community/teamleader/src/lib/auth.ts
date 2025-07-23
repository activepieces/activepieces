import { PieceAuth } from '@activepieces/pieces-framework';

// Custom Teamleader OAuth2 authentication using the correct endpoints and parameters
export const TeamleaderAuth = PieceAuth.OAuth2({
  required: true,
  authUrl: 'https://focus.teamleader.eu/oauth2/authorize',
  tokenUrl: 'https://focus.teamleader.eu/oauth2/access_token',
  scope: [
    'contacts:read',
    'contacts:write',
    'companies:read',
    'companies:write',
    'deals:read',
    'deals:write',
    'invoices:read',
    'invoices:write',
    'tasks:read',
    'tasks:write',
    'timeTracking:read',
    'timeTracking:write',
  ],
  // Optionally, you can add extra fields if Teamleader requires them
  props: {
    // Example: Property.ShortText({ displayName: 'Custom Field', required: false })
  },
}); 