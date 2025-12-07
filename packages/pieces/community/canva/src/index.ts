import { createCustomApiCallAction } from '@activepieces/pieces-common';
import {
  OAuth2PropertyValue,
  PieceAuth,
  createPiece,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { uploadAsset } from './lib/actions/upload-asset';
import { createDesign } from './lib/actions/create-design';
import { importDesign } from './lib/actions/import-design';
import { exportDesign } from './lib/actions/export-design';
import { moveFolderItem } from './lib/actions/move-folder-item';
import { findDesign } from './lib/actions/find-design';
import { getFolder } from './lib/actions/get-folder';
import { getImage } from './lib/actions/get-image';

export const canvaAuth = PieceAuth.OAuth2({
  description: '',
  authUrl: 'https://www.canva.com/api/oauth/authorize',
  tokenUrl: 'https://www.canva.com/api/oauth/token',
  required: true,
  scope: [
    'design:content:read',
    'design:content:write',
    'asset:read',
    'asset:write',
    'folder:read',
    'folder:write',
  ],
});

export const canva = createPiece({
  displayName: 'Canva',
  description: 'Online design platform for creating visual content',
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/canva.png',
  categories: [PieceCategory.CONTENT_AND_FILES],
  authors: ['badnewsgoonies'],
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
        Authorization: `Bearer ${(auth as OAuth2PropertyValue).access_token}`,
      }),
    }),
  ],
  triggers: [],
});
