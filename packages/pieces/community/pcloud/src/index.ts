import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece } from '@activepieces/pieces-framework';
import { pcloudAuth } from './lib/auth';

// Actions
import { pcloudUploadFile } from './lib/actions/upload-file';
import { pcloudDownloadFile } from './lib/actions/download-file';
import { pcloudDeleteFile } from './lib/actions/delete-file';
import { pcloudListFiles } from './lib/actions/list-files';
import { pcloudCreateFolder } from './lib/actions/create-folder';
import { pcloudCopyFile } from './lib/actions/copy-file';
import { pcloudGetFileInfo } from './lib/actions/get-file-info';
import { pcloudCreateLink } from './lib/actions/create-link';

// Triggers
import { pcloudNewFile } from './lib/triggers/new-file';
import { pcloudNewFolder } from './lib/triggers/new-folder';

export const pcloud = createPiece({
  displayName: 'pCloud',
  description: 'Secure cloud storage for file management and sharing',
  auth: pcloudAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/pcloud.png',
  authors: ['kishanprmr', 'NeoSoong'],
  actions: [
    pcloudUploadFile,
    pcloudDownloadFile,
    pcloudDeleteFile,
    pcloudListFiles,
    pcloudCreateFolder,
    pcloudCopyFile,
    pcloudGetFileInfo,
    pcloudCreateLink,
    createCustomApiCallAction({
      baseUrl: () => 'https://api.pcloud.com',
      auth: pcloudAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${(auth as any).access_token}`,
      }),
    }),
  ],
  triggers: [pcloudNewFile, pcloudNewFolder],
});
