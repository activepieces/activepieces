import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { canvaAuth, canvaCommon } from './lib/common';
import { createDesign } from './lib/actions/create-design';
import { getDesign } from './lib/actions/get-design';
import { uploadAsset } from './lib/actions/upload-asset';
import { importDesign } from './lib/actions/import-design';
import { exportDesign } from './lib/actions/export-design';
import { moveFolderItem } from './lib/actions/move-folder-item';
import { findDesign } from './lib/actions/find-design';
import { getFolder } from './lib/actions/get-folder';
import { getAsset } from './lib/actions/get-asset';
import { listFolderItems } from './lib/actions/list-folder-items';
import { createFolder } from './lib/actions/create-folder';
import { getJobStatus } from './lib/actions/get-job-status';
import { canvaListDesignsAi } from './lib/actions/ai/list-designs';
import { canvaGetDesignAi } from './lib/actions/ai/get-design';
import { canvaCreateDesignAi } from './lib/actions/ai/create-design';
import { canvaExportDesignAi } from './lib/actions/ai/export-design';
import { canvaGetExportJobAi } from './lib/actions/ai/get-export-job';
import { canvaUploadAssetFromUrlAi } from './lib/actions/ai/upload-asset-from-url';
import { canvaGetAssetUploadJobAi } from './lib/actions/ai/get-asset-upload-job';
import { canvaImportDesignFromUrlAi } from './lib/actions/ai/import-design-from-url';
import { canvaGetImportJobAi } from './lib/actions/ai/get-import-job';
import { canvaListFolderItemsAi } from './lib/actions/ai/list-folder-items';
import { canvaCreateFolderAi } from './lib/actions/ai/create-folder';
import { canvaMoveFolderItemAi } from './lib/actions/ai/move-folder-item';
import { canvaGetAssetAi } from './lib/actions/ai/get-asset';
import { canvaUpdateAssetAi } from './lib/actions/ai/update-asset';
import { canvaGetDesignPagesAi } from './lib/actions/ai/get-design-pages';
import { canvaGetExportFormatsAi } from './lib/actions/ai/get-export-formats';
import { canvaDeleteAssetAi } from './lib/actions/ai/delete-asset';

export const canva = createPiece({
  displayName: 'Canva',
  description: "Create, export and organize Canva designs and assets",
  auth: canvaAuth,
  minimumSupportedRelease: '0.86.4',
  logoUrl: 'https://cdn.activepieces.com/pieces/canva.png',
  categories: [PieceCategory.CONTENT_AND_FILES],
  authors: ['onyedikachi-david', 'OdaiAhmed99'],
  actions: [
    createDesign,
    getDesign,
    uploadAsset,
    importDesign,
    exportDesign,
    moveFolderItem,
    findDesign,
    getFolder,
    getAsset,
    listFolderItems,
    createFolder,
    getJobStatus,
    canvaListDesignsAi,
    canvaGetDesignAi,
    canvaCreateDesignAi,
    canvaExportDesignAi,
    canvaGetExportJobAi,
    canvaUploadAssetFromUrlAi,
    canvaGetAssetUploadJobAi,
    canvaImportDesignFromUrlAi,
    canvaGetImportJobAi,
    canvaListFolderItemsAi,
    canvaCreateFolderAi,
    canvaMoveFolderItemAi,
    canvaGetAssetAi,
    canvaUpdateAssetAi,
    canvaGetDesignPagesAi,
    canvaGetExportFormatsAi,
    canvaDeleteAssetAi,
    createCustomApiCallAction({
      baseUrl: () => canvaCommon.baseUrl,
      auth: canvaAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth.access_token}`,
      }),
    }),
  ],
  triggers: [],
});

export { canvaAuth };
