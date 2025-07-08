import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { uploadAsset } from './lib/actions/upload-asset';
import { createDesign } from './lib/actions/create-design';
import { importDesign } from './lib/actions/import-design';
import { exportDesign } from './lib/actions/export-design';
import { moveFolderItem } from './lib/actions/move-folder-item';
import { findDesign } from './lib/actions/find-design';
import { getFolder } from './lib/actions/get-folder';
import { getImage } from './lib/actions/get-an-image';

export const canvaAuth = PieceAuth.OAuth2({
  description: 'Authentication for Canva API',
  authUrl: 'https://www.canva.com/api/oauth/authorize',
  tokenUrl: 'https://api.canva.com/rest/v1/oauth/token',
  required: true,
  scope: ['design:read', 'design:write', 'folder:read', 'folder:write', 'asset:read', 'asset:write']
});

export const canva = createPiece({
  displayName: 'Canva',
  description: 'Create and manage designs, assets, and folders in Canva',
  minimumSupportedRelease: '0.5.0',
  logoUrl: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/canva.svg',
  authors: ['Ani-4x', 'kishan-parmar'],
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
  ],
  triggers: [],
});
