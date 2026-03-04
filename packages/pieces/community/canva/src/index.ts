import { createPiece, PieceAuth } from '@activepieces/pieces-framework';

export const canva = createPiece({
  displayName: 'Canva',
  description: 'Create, manage, and export designs using the Canva API',
  auth: PieceAuth.OAuth2({
    authUrl: 'https://accounts.canva.com/oauth/authorize',
    tokenUrl: 'https://accounts.canva.com/oauth/token',
    scopes: [
      'design:content:read',
      'design:content:write',
      'design:meta:read',
      'folder:read',
      'folder:write',
      'asset:read',
      'asset:write'
    ],
  }),
  minimumSupportedRelease: '0.71.2',
  logoUrl: 'https://cdn.activepieces.com/pieces/canva.png',
  authors: ['Community'],
  actions: [uploadAsset],
  triggers: []
});