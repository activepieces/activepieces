import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/pieces-framework';
import { newFileUploaded } from './triggers/new_file_uploaded';
import { folderCreated } from './triggers/folder_created';
import { uploadFile } from './actions/upload_file';
import { createFolder } from './actions/create_folder';
import { downloadFile } from './actions/download_file';
import { copyFile } from './actions/copy_file';
import { findFile } from './actions/find_file';
import { findFolder } from './actions/find_folder';
import { pcloudAuth } from './auth';

export const pcloud = createPiece({
  displayName: 'pCloud',
  description: 'Secure cloud storage and file management',
  auth: pcloudAuth,
  minimumSupportedRelease: '0.20.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/pcloud/logo.png',
  categories: [PieceCategory.FILE_STORAGE],
  authors: ['Activepieces'],
  triggers: [newFileUploaded, folderCreated],
  actions: [uploadFile, createFolder, downloadFile, copyFile, findFile, findFolder],
});
