import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { uploadFile } from './actions/upload-file';
import { createFolder } from './actions/create-folder';
import { getFileLink } from './actions/get-file-link';
import { newFile } from './triggers/new-file';

export const pcloudAuth = PieceAuth.OAuth2({
  displayName: 'Authentication',
  description: 'Connect your pCloud account',
  authUrl: 'https://my.pcloud.com/oauth2/authorize',
  tokenUrl: 'https://api.pcloud.com/oauth2_token',
  required: true,
  scope: [],
});

export const pcloud = createPiece({
  displayName: 'pCloud',
  description: 'Cloud storage service for storing and sharing files',
  auth: pcloudAuth,
  minimumSupportedRelease: '0.20.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/pcloud.png',
  categories: [PieceCategory.FILE_MANAGEMENT],
  authors: ['GitMehdi-sys'],
  actions: [uploadFile, createFolder, getFileLink],
  triggers: [newFile],
});
