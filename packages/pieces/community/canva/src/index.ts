import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { createCustomApiCallAction } from '@activepieces/pieces-common';

// Import all actions
import { uploadAssetAction } from './lib/actions/upload-asset';
import { createDesignAction } from './lib/actions/create-design';
import { importDesignAction } from './lib/actions/import-design';
import { exportDesignAction } from './lib/actions/export-design';
import { moveFolderItemAction } from './lib/actions/move-folder-item';
import { findDesignAction } from './lib/actions/find-design';
import { getFolderAction } from './lib/actions/get-folder';
import { getImageAction } from './lib/actions/get-image';

export const canvaAuth = PieceAuth.OAuth2({
  description: 'Connect your Canva account',
  authUrl: 'https://www.canva.com/api/oauth/authorize',
  tokenUrl: 'https://www.canva.com/api/oauth/token',
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
  description: 'Design platform for creating graphics, presentations, and documents',
  auth: canvaAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/canva.png',
  categories: [PieceCategory.PRODUCTIVITY, PieceCategory.MARKETING],
  authors: ['St34lthcole'],
  actions: [
    // Write actions
    uploadAssetAction,
    createDesignAction,
    importDesignAction,
    exportDesignAction,
    moveFolderItemAction,
    // Search actions
    findDesignAction,
    // Read actions
    getFolderAction,
    getImageAction,
    // Custom API call action
    createCustomApiCallAction({
      auth: canvaAuth,
      baseUrl: () => 'https://api.canva.com/rest/v1',
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth.access_token}`,
      }),
    }),
  ],
  triggers: [],
});
