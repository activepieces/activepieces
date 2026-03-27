import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { pcloudAuth } from './lib/auth';
import { pcloudUploadFile } from './lib/actions/upload-file';
import { pcloudCreateFolder } from './lib/actions/create-folder';
import { pcloudDownloadFile } from './lib/actions/download-file';
import { pcloudCopyFile } from './lib/actions/copy-file';
import { pcloudFindFile } from './lib/actions/find-file';
import { pcloudFindFolder } from './lib/actions/find-folder';
import { pcloudNewFileUploaded } from './lib/triggers/new-file-uploaded';
import { pcloudFolderCreated } from './lib/triggers/folder-created';
import { common } from './lib/common';

export const pcloud = createPiece({
  displayName: 'pCloud',
  description: 'Secure cloud storage for file management and sharing',
  auth: pcloudAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/pcloud.png',
  categories: [PieceCategory.CONTENT_AND_FILES],
  authors: ['skalaydzhiyski'],
  actions: [
    pcloudUploadFile,
    pcloudCreateFolder,
    pcloudDownloadFile,
    pcloudCopyFile,
    pcloudFindFile,
    pcloudFindFolder,
    createCustomApiCallAction({
      baseUrl: () => 'https://api.pcloud.com',
      auth: pcloudAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth.access_token}`,
      }),
    }),
  ],
  triggers: [pcloudNewFileUploaded, pcloudFolderCreated],
});
