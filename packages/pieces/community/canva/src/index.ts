import { createPiece } from '@activepieces/pieces-framework';
import { canvaAuth } from './lib/auth';
import { uploadAsset } from './lib/actions/upload-asset';
import { createDesign } from './lib/actions/create-design';
import { importDesign } from './lib/actions/import-design';
import { exportDesign } from './lib/actions/export-design';
import { moveFolderItem } from './lib/actions/move-folder-item';
import { findDesign } from './lib/actions/find-design';
import { getFolder } from './lib/actions/get-folder';
import { getImage } from './lib/actions/get-image';

export const canva = createPiece({
  displayName: 'Canva',
  description: 'Integration with Canva platform',
  auth: canvaAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/canva.png',
  authors: [],
  actions: [
    uploadAsset,
    createDesign,
    importDesign,
    exportDesign,
    moveFolderItem,
    findDesign,
    getFolder,
    getImage
  ],
  triggers: []
});