import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { pcloudAuth } from './lib/auth';
import {
  listFolder,
  createFolder,
  uploadFile,
  downloadFile,
  deleteFile,
  copyFile,
} from './lib/actions';
import {
  newFileTrigger,
  newFolderTrigger,
} from './lib/triggers';

export const pcloud = createPiece({
  displayName: 'pCloud',
  description: 'Secure cloud storage - Store, share, and access your files from anywhere',
  logoUrl: 'https://www.pcloud.com/favicon.ico',
  categories: [PieceCategory.FILE_STORAGE],
  authors: ['ktwo'],
  auth: pcloudAuth,
  minimumSupportedRelease: '1.0.0',
  actions: [
    listFolder,
    createFolder,
    uploadFile,
    downloadFile,
    deleteFile,
    copyFile,
  ],
  triggers: [
    newFileTrigger,
    newFolderTrigger,
  ],
});
