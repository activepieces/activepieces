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
import { pcloudNewFile } from './lib/triggers/new-file';
import { pcloudNewFolder } from './lib/triggers/new-folder';

export const pcloud = createPiece({
  displayName: 'pCloud',
  description: 'Secure cloud storage and file management',
  auth: pcloudAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/pcloud.png',
  categories: [PieceCategory.CONTENT_AND_FILES],
  authors: ['optimus-fulcria'],
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
        Authorization: `Bearer ${(auth as { access_token: string }).access_token}`,
      }),
    }),
  ],
  triggers: [pcloudNewFile, pcloudNewFolder],
});
