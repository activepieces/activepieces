import { PieceAuth, OAuth2PropertyValue } from '@activepieces/pieces-framework';

export const canvaAuth = PieceAuth.OAuth2({
  description: 'Authenticate with Canva to access your designs and assets',
  authUrl: 'https://www.canva.com/oauth/authorize',
  tokenUrl: 'https://api.canva.com/oauth/token',
  required: true,
  scope: ['design', 'design:write', 'media:write'],
});