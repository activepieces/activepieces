import {
  createPiece,
  OAuth2PropertyValue,
  PieceAuth,
} from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { PieceCategory } from '@activepieces/shared';
import { canvaCommon } from './lib/common';
import { createDesign } from './lib/actions/create-design';
import { exportDesign } from './lib/actions/export-design';
import { findDesign } from './lib/actions/find-design';
import { uploadAsset } from './lib/actions/upload-asset';
import { getAsset } from './lib/actions/get-asset';
import { getFolder } from './lib/actions/get-folder';
import { moveFolderItem } from './lib/actions/move-folder-item';

export const canvaAuth = PieceAuth.OAuth2({
  required: true,
  authUrl: 'https://www.canva.com/api/oauth/authorize',
  tokenUrl: 'https://api.canva.com/rest/v1/oauth/token',
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
    'Online design platform for creating visual content like social graphics, presentations, and posters.',
  auth: canvaAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/canva.png',
  categories: [PieceCategory.CONTENT_AND_FILES],
  authors: ['Rhan2020'],
  actions: [
    createDesign,
    exportDesign,
    findDesign,
    uploadAsset,
    getAsset,
    getFolder,
    moveFolderItem,
    createCustomApiCallAction({
      baseUrl: () => canvaCommon.baseUrl,
      auth: canvaAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${(auth as OAuth2PropertyValue).access_token}`,
      }),
    }),
  ],
  triggers: [],
});
