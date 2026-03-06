import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { pCloudAuth } from './lib/auth';

// Actions
import { uploadFile } from './lib/actions/upload-file';
import { createFolder } from './lib/actions/create-folder';
import { downloadFile } from './lib/actions/download-file';
import { copyFile } from './lib/actions/copy-file';
import { findFileFolder } from './lib/actions/find-file-folder';

// Triggers
import { newFileUploaded } from './lib/triggers/new-file-uploaded';
import { newFolderCreated } from './lib/triggers/new-folder-created';

export const pCloud = createPiece({
  displayName: 'pCloud',
  auth: pCloudAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/pcloud.png',
  authors: ['activepieces-community'],
  categories: [PieceCategory.CONTENT_AND_FILES],
  description: 'Secure cloud storage and file management with pCloud.',
  actions: [
    uploadFile,
    createFolder,
    downloadFile,
    copyFile,
    findFileFolder,
  ],
  triggers: [
    newFileUploaded,
    newFolderCreated,
  ],
});
