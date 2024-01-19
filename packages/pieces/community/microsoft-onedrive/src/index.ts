import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { uploadFile } from './lib/actions/upload-file';
import { listFiles } from './lib/actions/list-files';
import { listFolders } from './lib/actions/list-folders';
import { downloadFile } from './lib/actions/download-file';
import { newFile } from './lib/triggers/new-file';

export const oneDriveAuth = PieceAuth.OAuth2({
  description: 'Authentication for Microsoft OneDrive',
  authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
  tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
  required: true,
  scope: ['Files.ReadWrite', 'offline_access'],
});

export const microsoftOneDrive = createPiece({
  displayName: 'Microsoft OneDrive',
  auth: oneDriveAuth,
  minimumSupportedRelease: '0.8.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/oneDrive.png',
  authors: ['BastienMe'],
  actions: [uploadFile, downloadFile, listFiles, listFolders],
  triggers: [newFile],
});
