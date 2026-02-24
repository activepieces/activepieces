import { createCustomApiCallAction } from '@activepieces/pieces-common';
import {
  createPiece,
  OAuth2PropertyValue,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';

import { createFolderAction } from './lib/actions/create-folder';
import { createListAction } from './lib/actions/create-list';
import { createListItemAction } from './lib/actions/create-list-item';
import { deleteListItemAction } from './lib/actions/delete-list-item';
import { findListItemAction } from './lib/actions/search-list-item';
import { updateListItemAction } from './lib/actions/update-list-item';
import { uploadFile } from './lib/actions/upload-file';

import { copyItemAction } from './lib/actions/copy-item';
import { copyItemWithinSiteAction } from './lib/actions/copy-item-within-site';
import { findFileAction } from './lib/actions/find-file';
import { getFolderContentsAction } from './lib/actions/get-folder-contents';
import { getSiteInformationAction } from './lib/actions/get-site-information';
import { moveFileAction } from './lib/actions/move-file';
import { publishPageAction } from './lib/actions/publish-page';

import { microsoftSharePointAuth } from './lib/auth';
import { newFileInFolderTrigger } from './lib/triggers/new-file-in-folder';
import { newFileInSubfoldersTrigger } from './lib/triggers/new-file-in-subfolders';
import { newListTrigger } from './lib/triggers/new-list';
import { newListItemTrigger } from './lib/triggers/new-list-item';
import { newOrUpdatedFileTrigger } from './lib/triggers/new-or-updated-file';
import { newOrUpdatedFolderTrigger } from './lib/triggers/new-or-updated-folder';
import { newOrUpdatedListTrigger } from './lib/triggers/new-or-updated-list';
import { updatedListItemTrigger } from './lib/triggers/updated-list-item';

export const microsoftSharePoint = createPiece({
  displayName: 'Microsoft SharePoint',
  auth: microsoftSharePointAuth,
  minimumSupportedRelease: '0.78.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/microsoft-sharepoint.png',
  categories: [PieceCategory.CONTENT_AND_FILES],
  authors: ['kishanprmr', 'pranith124', 'onyedikachi-david'],
  actions: [
    createFolderAction,
    createListAction,
    createListItemAction,
    updateListItemAction,
    deleteListItemAction,
    findListItemAction,
    uploadFile,
    publishPageAction,
    copyItemAction,
    copyItemWithinSiteAction,
    moveFileAction,
    findFileAction,
    getFolderContentsAction,
    getSiteInformationAction,
    createCustomApiCallAction({
      auth: microsoftSharePointAuth,
      baseUrl: () => 'https://graph.microsoft.com/v1.0',
      authMapping: async (auth) => ({
        Authorization: `Bearer ${(auth as OAuth2PropertyValue).access_token}`,
      }),
    }),
  ],
  triggers: [
    newFileInFolderTrigger,
    newFileInSubfoldersTrigger,
    newOrUpdatedFileTrigger,
    newOrUpdatedFolderTrigger,
    newListItemTrigger,
    updatedListItemTrigger,
    newListTrigger,
    newOrUpdatedListTrigger,
  ],
});
