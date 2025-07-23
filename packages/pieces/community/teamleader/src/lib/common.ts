import { PieceAuth } from '@activepieces/pieces-framework';

export const TeamleaderAuth = PieceAuth.OAuth2({
  required: true,
  authUrl: 'https://app.teamleader.eu/oauth2/authorize',
  tokenUrl: 'https://app.teamleader.eu/oauth2/access_token',
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
}); 