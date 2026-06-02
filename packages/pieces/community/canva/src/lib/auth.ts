import { PieceAuth } from '@activepieces/pieces-framework';

export const canvaAuth = PieceAuth.OAuth2({
  description: '',
  authUrl: 'https://www.canva.com/api/oauth/authorize',
  tokenUrl: 'https://www.canva.com/api/oauth/token',
  required: true,
  scope: [
    'asset:read',
    'asset:write',
    'design:content:read',
    'design:content:write',
    'design:meta:read',
    'folder:read',
    'folder:write',
  ],
});
