import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { OAuth2PropertyValue, createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { canvaAuth } from './lib/auth';
import { createDesign } from './lib/actions/create-design';
import { exportDesign } from './lib/actions/export-design';
import { getAsset } from './lib/actions/get-asset';
import { getDesign } from './lib/actions/get-design';
import { getFolder } from './lib/actions/get-folder';
import { importDesign } from './lib/actions/import-design';
import { listDesigns } from './lib/actions/list-designs';
import { moveFolderItem } from './lib/actions/move-folder-item';
import { uploadAsset } from './lib/actions/upload-asset';
import { CANVA_API_BASE_URL } from './lib/common';

export const canva = createPiece({
  displayName: 'Canva',
  description: 'Online design platform for creating visual content',
  logoUrl: 'https://cdn.activepieces.com/pieces/canva.png',
  categories: [PieceCategory.PRODUCTIVITY],
  minimumSupportedRelease: '0.30.0',
  authors: ['selenaalpha77-sketch'],
  auth: canvaAuth,
  actions: [
    createDesign,
    listDesigns,
    getDesign,
    exportDesign,
    importDesign,
    uploadAsset,
    getAsset,
    getFolder,
    moveFolderItem,
    createCustomApiCallAction({
      baseUrl: () => CANVA_API_BASE_URL,
      auth: canvaAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${(auth as OAuth2PropertyValue).access_token}`,
      }),
    }),
  ],
  triggers: [],
});
