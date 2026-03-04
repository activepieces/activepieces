import { PieceAuth } from '@activepieces/pieces-framework';

export const canvaAuth = PieceAuth.OAuth2({
  displayName: 'Canva OAuth2',
  description: 'OAuth2 authentication for Canva',
  authUrl: 'https://api.canva.com/auth',
  tokenUrl: 'https://api.canva.com/token',
  required: true,
  scope: [
    'design:content:read',
    'design:content:write',
    'design:meta:read',
    'folder:read',
    'folder:write',
    'asset:read',
    'asset:write'
  ].join(' ')
});