import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { canvaAuth } from './lib/auth';
import { getDesign } from './lib/actions/get-design';
import { searchDesigns } from './lib/actions/search-designs';
import { createDesign } from './lib/actions/create-design';
import { importDesign } from './lib/actions/import-design';
import { exportDesign } from './lib/actions/export-design';
import { uploadAsset } from './lib/actions/upload-asset';
import { getAsset } from './lib/actions/get-asset';
import { listFolderItems } from './lib/actions/list-folder-items';
import { createFolder } from './lib/actions/create-folder';
import { moveItemToFolder } from './lib/actions/move-item-to-folder';

export const canva = createPiece({
  displayName: 'Canva',
  description: 'Design, collaborate, and publish with Canva',
  logoUrl: 'https://cdn.activepieces.com/pieces/canva.png',
  minimumSupportedRelease: '0.30.0',
  authors: ['pulkitsaraf'],
  categories: [PieceCategory.PRODUCTIVITY],
  auth: canvaAuth,
  actions: [
    getDesign,
    searchDesigns,
    createDesign,
    importDesign,
    exportDesign,
    uploadAsset,
    getAsset,
    listFolderItems,
    createFolder,
    moveItemToFolder,
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
