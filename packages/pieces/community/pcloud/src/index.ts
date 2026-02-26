import { createCustomApiCallAction } from '@activepieces/pieces-common';
import {
  OAuth2PropertyValue,
  PieceAuth,
  createPiece,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { pcloudUploadFile } from './lib/actions/upload-file';
import { pcloudDownloadFile } from './lib/actions/download-file';
import { pcloudListFolder } from './lib/actions/list-folder';
import { pcloudCreateFolder } from './lib/actions/create-folder';
import { pcloudDeleteFile } from './lib/actions/delete-file';
import { pcloudDeleteFolder } from './lib/actions/delete-folder';
import { pcloudCopyFile } from './lib/actions/copy-file';
import { pcloudMoveFile } from './lib/actions/move-file';
import { pcloudGetFileLink } from './lib/actions/get-file-link';

export const pcloudAuth = PieceAuth.OAuth2({
  description: 'Connect to your pCloud account',
  authUrl: 'https://my.pcloud.com/oauth2/authorize',
  tokenUrl: 'https://api.pcloud.com/oauth2_token',
  required: true,
  scope: [],
});

export const pcloud = createPiece({
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/pcloud.png',
  actions: [
    pcloudUploadFile,
    pcloudDownloadFile,
    pcloudListFolder,
    pcloudCreateFolder,
    pcloudDeleteFile,
    pcloudDeleteFolder,
    pcloudCopyFile,
    pcloudMoveFile,
    pcloudGetFileLink,
    createCustomApiCallAction({
      baseUrl: () => 'https://api.pcloud.com',
      auth: pcloudAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${(auth as OAuth2PropertyValue).access_token}`,
      }),
    }),
  ],
  displayName: 'pCloud',
  description: 'Secure cloud storage for your files',
  authors: ['claude-code'],
  categories: [PieceCategory.CONTENT_AND_FILES],
  triggers: [],
  auth: pcloudAuth,
});
