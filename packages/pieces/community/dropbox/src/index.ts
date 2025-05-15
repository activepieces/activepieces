import { createCustomApiCallAction } from '@activepieces/pieces-common';
import {
  OAuth2PropertyValue,
  PieceAuth,
  createPiece,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { dropboxCopyFile } from './lib/actions/copy-file';
import { dropboxCopyFolder } from './lib/actions/copy-folder';
import { dropboxCreateNewFolder } from './lib/actions/create-new-folder';
import { dropboxCreateNewTextFile } from './lib/actions/create-new-text-file';
import { dropboxDeleteFile } from './lib/actions/delete-file';
import { dropboxDeleteFolder } from './lib/actions/delete-folder';
import { dropboxGetFileLink } from './lib/actions/get-file-link';
import { dropboxListAFolder } from './lib/actions/list-a-folder';
import { dropboxMoveFile } from './lib/actions/move-file';
import { dropboxMoveFolder } from './lib/actions/move-folder';
import { dropboxSearch } from './lib/actions/search';
import { dropboxUploadFile } from './lib/actions/upload-file';

export const dropboxAuth = PieceAuth.OAuth2({
  description: '',
  authUrl: 'https://www.dropbox.com/oauth2/authorize',
  tokenUrl: 'https://api.dropboxapi.com/oauth2/token',
  required: true,
  // include token_access_type=offline as a parameter on Authorization URL in order to return a refresh_token
  extra: { token_access_type: 'offline' },
  scope: [
    'files.metadata.write',
    'files.metadata.read',
    'files.content.write',
    'files.content.read',
  ],
});

export const dropbox = createPiece({
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/dropbox.png',
  actions: [
    dropboxSearch,
    dropboxCreateNewTextFile,
    dropboxUploadFile,
    dropboxGetFileLink,
    dropboxDeleteFile,
    dropboxMoveFile,
    dropboxCopyFile,
    dropboxCreateNewFolder,
    dropboxDeleteFolder,
    dropboxMoveFolder,
    dropboxCopyFolder,
    dropboxListAFolder,
    createCustomApiCallAction({
      baseUrl: () => 'https://api.dropboxapi.com/2',
      auth: dropboxAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${(auth as OAuth2PropertyValue).access_token}`,
      }),
    }),
  ],
  displayName: 'Dropbox',
  description: 'Cloud storage and file synchronization',
  authors: [
    'BastienMe',
    'kishanprmr',
    'MoShizzle',
    'khaledmashaly',
    'abuaboud',
  ],
  categories: [PieceCategory.CONTENT_AND_FILES],
  triggers: [],
  auth: dropboxAuth,
});
