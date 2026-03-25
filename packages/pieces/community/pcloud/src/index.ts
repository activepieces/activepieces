import { createCustomApiCallAction } from '@activepieces/pieces-common';
import {
  createPiece,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { pcloudListFolder } from './lib/actions/list-folder';
import { pcloudUploadFile } from './lib/actions/upload-file';
import { pcloudDownloadFile } from './lib/actions/download-file';
import { pcloudCreateFolder } from './lib/actions/create-folder';
import { pcloudDeleteFile } from './lib/actions/delete-file';
import { pcloudGetFileInfo } from './lib/actions/get-file-info';
import { pcloudAuth } from './lib/auth';

export const pcloud = createPiece({
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/brand/logo.svg',
  actions: [
    pcloudListFolder,
    pcloudUploadFile,
    pcloudDownloadFile,
    pcloudCreateFolder,
    pcloudDeleteFile,
    pcloudGetFileInfo,
    createCustomApiCallAction({
      baseUrl: () => 'https://api.pcloud.com',
      auth: pcloudAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth.access_token}`,
      }),
    }),
  ],
  displayName: 'pCloud',
  description: 'Cloud storage and file synchronization',
  authors: ['your-username'],
  categories: [PieceCategory.CONTENT_AND_FILES],
  triggers: [],
  auth: pcloudAuth,
});
