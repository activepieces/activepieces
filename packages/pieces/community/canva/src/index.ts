import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { OAuth2PropertyValue, PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { createDesign } from './lib/actions/create-design';
import { uploadAsset } from './lib/actions/upload-asset';
import { importDesign } from './lib/actions/import-design';
import { exportDesign } from './lib/actions/export-design';
import { getDesign } from './lib/actions/get-design';
import { findDesign } from './lib/actions/find-design';
import { moveFolderItem } from './lib/actions/move-folder-item';
import { getFolder } from './lib/actions/get-folder';
import { getAsset } from './lib/actions/get-asset';

export const canvaAuth = PieceAuth.OAuth2({
  description: 'Authenticate with your Canva account.',
  authUrl: 'https://www.canva.com/api/oauth/authorize',
  tokenUrl: 'https://api.canva.com/rest/v1/oauth/token',
  required: true,
  pkce: true,
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
  description: 'Design automation with Canva — create, import, export, and manage designs.',
  auth: canvaAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/canva.png',
  categories: [PieceCategory.CONTENT_AND_FILES],
  authors: ['GoThundercats'],
  actions: [
    createDesign,
    uploadAsset,
    importDesign,
    exportDesign,
    getDesign,
    findDesign,
    moveFolderItem,
    getFolder,
    getAsset,
    createCustomApiCallAction({
      baseUrl: () => 'https://api.canva.com/rest/v1',
      auth: canvaAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${(auth as OAuth2PropertyValue).access_token}`,
      }),
    }),
  ],
  triggers: [],
});
