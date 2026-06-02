import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { canvaAuth } from './lib/auth';
import { canvaUploadAsset } from './lib/actions/upload-asset';
import { canvaCreateDesign } from './lib/actions/create-design';
import { canvaImportDesign } from './lib/actions/import-design';
import { canvaExportDesign } from './lib/actions/export-design';
import { canvaMoveFolderItem } from './lib/actions/move-folder-item';
import { canvaFindDesign } from './lib/actions/find-design';
import { canvaGetFolder } from './lib/actions/get-folder';

export const canva = createPiece({
  displayName: 'Canva',
  description: 'Online design platform for creating visual content.',
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/canva.png',
  categories: [PieceCategory.CONTENT_AND_FILES],
  auth: canvaAuth,
  actions: [
    canvaUploadAsset,
    canvaCreateDesign,
    canvaImportDesign,
    canvaExportDesign,
    canvaMoveFolderItem,
    canvaFindDesign,
    canvaGetFolder,
    createCustomApiCallAction({
      auth: canvaAuth,
      baseUrl: () => 'https://api.canva.com/rest/v1',
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth.access_token}`,
      }),
    }),
  ],
  authors: ['bisgeario'],
  triggers: [],
});
