import { createPiece } from '@activepieces/pieces-framework';
import { canvaAuth } from './lib/auth';
import { uploadAssetAction } from './lib/actions/upload-asset';
import { createDesignAction } from './lib/actions/create-design';
import { importDesignAction } from './lib/actions/import-design';
import { exportDesignAction } from './lib/actions/export-design';
import { moveFolderItemAction } from './lib/actions/move-folder-item';
import { findDesignAction } from './lib/actions/find-design';
import { getFolderAction } from './lib/actions/get-folder';
import { getImageAction } from './lib/actions/get-image';

export const canva = createPiece({
  displayName: 'Canva',
  minimumSupportedRelease: '0.9.0', // Adjust based on framework features used
  logoUrl: 'https://cdn.activepieces.com/pieces/canva.png', // Placeholder, replace with actual logo
  authors: ['Activepieces'],
  auth: canvaAuth,
  actions: [
    uploadAssetAction,
    createDesignAction,
    importDesignAction,
    exportDesignAction,
    moveFolderItemAction,
    findDesignAction,
    getFolderAction,
    getImageAction,
  ],
  triggers: [], // No triggers requested in the issue
});
