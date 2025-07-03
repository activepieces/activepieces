import { createCustomApiCallAction } from '@activepieces/pieces-common';
import {
  createPiece,
  OAuth2PropertyValue,
  PieceAuth,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { downloadFile } from './lib/actions/download-file';
import { listFiles } from './lib/actions/list-files';
import { listFolders } from './lib/actions/list-folders';
import { uploadFile } from './lib/actions/upload-file';
import { oneDriveCommon } from './lib/common/common';
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
  description: 'Cloud storage by Microsoft',

  auth: oneDriveAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/oneDrive.png',
  categories: [PieceCategory.CONTENT_AND_FILES],
  authors: ["BastienMe","kishanprmr","MoShizzle","abuaboud","ikus060"],
  actions: [
    uploadFile,
    downloadFile,
    listFiles,
    listFolders,
    createCustomApiCallAction({
      baseUrl: () => oneDriveCommon.baseUrl,
      auth: oneDriveAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${(auth as OAuth2PropertyValue).access_token}`,
      }),
    }),
  ],
  triggers: [newFile],
});
