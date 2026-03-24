import { createPiece } from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { PieceCategory } from '@activepieces/shared';
import { pcloudAuth } from './lib/auth';
import { newFileUploaded } from './lib/triggers/new-file-uploaded';
import { newFolderCreated } from './lib/triggers/new-folder-created';
import { uploadFile } from './lib/actions/upload-file';
import { createFolder } from './lib/actions/create-folder';
import { downloadFile } from './lib/actions/download-file';
import { copyFile } from './lib/actions/copy-file';
import { findFile } from './lib/actions/find-file';
import { findFolder } from './lib/actions/find-folder';

export const pcloud = createPiece({
  displayName: 'pCloud',
  description: 'Secure cloud storage and file management',
  auth: pcloudAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/pcloud.png',
  categories: [PieceCategory.CONTENT_AND_FILES],
  authors: ['kalilynux655'],
  triggers: [newFileUploaded, newFolderCreated],
  actions: [
    uploadFile,
    createFolder,
    downloadFile,
    copyFile,
    findFile,
    findFolder,
    createCustomApiCallAction({
      baseUrl: () => 'https://api.pcloud.com',
      auth: pcloudAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${(auth as { access_token: string }).access_token}`,
      }),
    }),
  ],
});
