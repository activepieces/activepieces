import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { uploadAsset } from './lib/actions/upload-asset';
import { createDesign } from './lib/actions/create-design';
import { importDesign } from './lib/actions/import-design';
import { exportDesign } from './lib/actions/export-design';
import { moveFolderItem } from './lib/actions/move-folder-item';
import { findDesign } from './lib/actions/find-design';
import { getFolder } from './lib/actions/get-folder';
import { getImage } from './lib/actions/get-image';

export const canvaAuth = PieceAuth.OAuth2({
  description: 'Authenticate with your Canva account.',
  authUrl: 'https://www.canva.com/api/oauth/authorize',
  tokenUrl: 'https://api.canva.com/rest/v1/oauth/token',
  required: true,
  scope: [
    'design:content:read',
    'design:content:write',
    'design:meta:read',
    'asset:read',
    'asset:write',
    'folder:read',
    'folder:write',
  ],
});

export const canva = createPiece({
  displayName: 'Canva',
  description:
    'Online design platform for creating social graphics, presentations, posters, and more.',
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/canva.png',
  authors: ['Crazy-D1359'],
  categories: [PieceCategory.CONTENT_AND_FILES],
  auth: canvaAuth,
  actions: [
    uploadAsset,
    createDesign,
    importDesign,
    exportDesign,
    moveFolderItem,
    findDesign,
    getFolder,
    getImage,
    createCustomApiCallAction({
      baseUrl: () => 'https://api.canva.com/rest/v1',
      auth: canvaAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${(auth as { access_token: string }).access_token}`,
      }),
    }),
  ],
  triggers: [],
});
