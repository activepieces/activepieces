import {
  createPiece,
  PieceAuth,
  OAuth2PropertyValue,
} from '@ensemble/pieces-framework';
import { PieceCategory } from '@ensemble/shared';
import { createFolderAction } from './lib/actions/create-folder';
import { createListAction } from './lib/actions/create-list';
import { createListItemAction } from './lib/actions/create-list-item';
import { updateListItemAction } from './lib/actions/update-list-item';
import { deleteListItemAction } from './lib/actions/delete-list-item';
import { findListItemAction } from './lib/actions/search-list-item';
import { uploadFile } from './lib/actions/upload-file';
import { createCustomApiCallAction } from '@ensemble/pieces-common';

export const microsoftSharePointAuth = PieceAuth.OAuth2({
  description: 'Authentication for Microsoft SharePoint',
  authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
  tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
  required: true,
  scope: [
    'openid',
    'email',
    'profile',
    'offline_access',
    'Sites.Manage.All',
    'Files.ReadWrite',
  ],
});

export const microsoftSharePoint = createPiece({
  displayName: 'Microsoft SharePoint',
  auth: microsoftSharePointAuth,
  minimumSupportedRelease: '0.27.1',
  logoUrl: 'https://cdn.ensemble.com/pieces/microsoft-sharepoint.png',
  categories: [PieceCategory.CONTENT_AND_FILES],
  authors: ['kishanprmr'],
  actions: [
    createFolderAction,
    createListAction,
    createListItemAction,
    updateListItemAction,
    deleteListItemAction,
    findListItemAction,
    uploadFile,
    createCustomApiCallAction({
      auth: microsoftSharePointAuth,
      baseUrl: () => 'https://graph.microsoft.com/v1.0/sites',
      authMapping: async (auth) => ({
        Authorization: `Bearer ${(auth as OAuth2PropertyValue).access_token}`,
      }),
    }),
  ],
  triggers: [],
});
