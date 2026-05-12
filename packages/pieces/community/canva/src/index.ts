import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { canvaAuth } from './lib/auth';
import { createDesignAction } from './lib/actions/create-design';
import { exportDesignAction } from './lib/actions/export-design';
import { findDesignAction } from './lib/actions/find-design';
import { getAssetAction } from './lib/actions/get-asset';
import { getFolderAction } from './lib/actions/get-folder';
import { importDesignAction } from './lib/actions/import-design';
import { moveFolderItemAction } from './lib/actions/move-folder-item';
import { uploadAssetAction } from './lib/actions/upload-asset';

export const canva = createPiece({
  displayName: 'Canva',
  description:
    'Online design platform for creating visual content like graphics, presentations, and posters.',
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/canva.png',
  categories: [PieceCategory.CONTENT_AND_FILES],
  authors: ['doublesilver'],
  auth: canvaAuth,
  actions: [
    createDesignAction,
    findDesignAction,
    exportDesignAction,
    importDesignAction,
    uploadAssetAction,
    moveFolderItemAction,
    getFolderAction,
    getAssetAction,
    createCustomApiCallAction({
      baseUrl: () => 'https://api.canva.com/rest/v1',
      auth: canvaAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth.access_token}`,
      }),
    }),
  ],
  triggers: [],
});
