import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { pCloudAuth } from './lib/auth';
import { pCloudUploadFileAction } from './lib/actions/upload-file';
import { pCloudListFilesAction } from './lib/actions/list-files';

export const pcloud = createPiece({
  displayName: 'pCloud',
  description: 'Secure cloud storage for your files',
  auth: pCloudAuth,
  minimumSupportedRelease: '0.20.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/pcloud.png',
  categories: [PieceCategory.CONTENT_AND_FILES],
  authors: ['oocheol'],
  actions: [pCloudUploadFileAction, pCloudListFilesAction],
  triggers: [],
});
