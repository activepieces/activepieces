import { PieceAuth, Property } from '@activepieces/pieces-framework';

// Enhanced Teamleader OAuth2 authentication with user guidance and custom domain field
// NOTE: Dynamic domain support for authUrl/tokenUrl is not possible if the framework does not support function values for these fields.
// The customDomain property is left for future support or for use in API calls.
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
  props: {
    // Optional: Allow user to specify a custom Teamleader domain (for multi-region or custom environments)
    customDomain: Property.ShortText({
      displayName: 'Custom Teamleader Domain',
      required: false,
      description: 'If your Teamleader account uses a custom region or environment, enter the full domain (e.g., https://myregion.teamleader.eu). Otherwise, leave blank.',
    }),
  },
  // No need for a custom validate function; validation is handled in the UI or in API calls.
}); 