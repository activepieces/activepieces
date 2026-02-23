import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { PieceCategory } from '@activepieces/shared';
import { pcloudUploadFile } from './lib/actions/upload-file';
import { pcloudCreateFolder } from './lib/actions/create-folder';
import { pcloudGetFileLink } from './lib/actions/get-file-link';
import { pcloudListFolder } from './lib/actions/list-folder';
import { pcloudCopyFile } from './lib/actions/copy-file';
import { pcloudNewFile } from './lib/triggers/new-file';
import { pcloudNewFolder } from './lib/triggers/new-folder';

export const pcloudAuth = PieceAuth.OAuth2({
  description: 'Authenticate with your pCloud account',
  authUrl: 'https://my.pcloud.com/oauth2/authorize',
  tokenUrl: 'https://api.pcloud.com/oauth2_token',
  required: true,
  scope: [],
});

export const pcloud = createPiece({
  displayName: 'pCloud',
  description: 'Secure cloud storage for files and folders',
  auth: pcloudAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/pcloud.png',
  categories: [PieceCategory.CONTENT_AND_FILES],
  authors: ['your-username'],
  actions: [
    pcloudUploadFile,
    pcloudCreateFolder,
    pcloudGetFileLink,
    pcloudListFolder,
    pcloudCopyFile,
    createCustomApiCallAction({
      baseUrl: () => 'https://api.pcloud.com',
      auth: pcloudAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth.access_token}`,
      }),
    }),
  ],
  triggers: [pcloudNewFile, pcloudNewFolder],
});
