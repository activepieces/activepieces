import { createCustomApiCallAction } from '@activepieces/pieces-common';
import {
  createPiece,
  OAuth2PropertyValue,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { downloadFile } from './lib/actions/download-file';
import { listFiles } from './lib/actions/list-files';
import { listFolders } from './lib/actions/list-folders';
import { uploadFile } from './lib/actions/upload-file';
import { oneDriveAuth } from './lib/auth';
import { oneDriveCommon } from './lib/common/common';
import { newFile } from './lib/triggers/new-file';

export const microsoftOneDrive = createPiece({
  displayName: 'Microsoft OneDrive',
  description: 'Cloud storage by Microsoft',
  auth: oneDriveAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/oneDrive.png',
  categories: [PieceCategory.CONTENT_AND_FILES],
  authors: ['BastienMe', 'kishanprmr', 'MoShizzle', 'abuaboud', 'ikus060'],
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
