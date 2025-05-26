import { createPiece } from '@activepieces/pieces-framework';

import { copyFile } from './lib/actions/copy-file';
import { createFolder } from './lib/actions/create-folder';
import { downloadFile } from './lib/actions/download-file';
import { findFile } from './lib/actions/find-file';
import { findFolder } from './lib/actions/find-folder';
import { uploadFile } from './lib/actions/upload-file';
import { newFile } from './lib/triggers/new-file';
import { newFolder } from './lib/triggers/new-folder';
import { pcloudAuth } from './lib/auth';

export const pcloud = createPiece({
  displayName: 'Pcloud',
  auth: pcloudAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/pcloud.png',
  authors: ['Sanket6652'],
  actions: [
    copyFile,
    createFolder,
    downloadFile,
    findFile,
    findFolder,
    uploadFile,
  ],
  triggers: [newFile, newFolder],
});
