import {
  createPiece,
  PieceAuth,
  OAuth2PropertyValue,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { createCustomApiCallAction } from '@activepieces/pieces-common';


import { createFolderAction } from './lib/actions/create-folder';
import { createListAction } from './lib/actions/create-list';
import { createListItemAction } from './lib/actions/create-list-item';
import { updateListItemAction } from './lib/actions/update-list-item';
import { deleteListItemAction } from './lib/actions/delete-list-item';
import { findListItemAction } from './lib/actions/search-list-item';
import { uploadFile } from './lib/actions/upload-file';


import { publishPageAction } from './lib/actions/publish-page';
import { copyItemAction } from './lib/actions/copy-item';
import { copyItemWithinSiteAction } from './lib/actions/copy-item-within-site';
import { moveFileAction } from './lib/actions/move-file';
import { findFileAction } from './lib/actions/find-file';
import { getFolderContentsAction } from './lib/actions/get-folder-contents';
import { getSiteInformationAction } from './lib/actions/get-site-information';


import { newFileInFolderTrigger } from './lib/triggers/new-file-in-folder';
import { newFileInSubfoldersTrigger } from './lib/triggers/new-file-in-subfolders';
import { newOrUpdatedFileTrigger } from './lib/triggers/new-or-updated-file';
import { newOrUpdatedFolderTrigger } from './lib/triggers/new-or-updated-folder';
import { newListItemTrigger } from './lib/triggers/new-list-item';
import { updatedListItemTrigger } from './lib/triggers/updated-list-item';
import { newListTrigger } from './lib/triggers/new-list';
import { newOrUpdatedListTrigger } from './lib/triggers/new-or-updated-list';


const authDesc = `
1. Sign in to [Microsoft Azure Portal](https://portal.azure.com/).
2. From the left sidebar, go to **Microsoft Enfra ID**.
3. Under **Manage**, click on **App registrations**.
4. Click the **New registration** button.
5. Enter a **Name** for your app.
6. For **Supported account types**, choose:
   - **Accounts in any organizational directory (Any Microsoft Entra ID tenant - Multitenant) and personal Microsoft accounts**
   - Or select based on your requirement.
7. In **Redirect URI**, select **Web** and add the given URL.
8. Click **Register**.
9. After registration, you’ll be redirected to the app’s overview page. Copy the **Application (client) ID**.
10. From the left menu, go to **Certificates & secrets**.
    - Under **Client secrets**, click **New client secret**.
    - Provide a description, set an expiry, and click **Add**.
    - Copy the **Value** of the client secret (this will not be shown again).
11. Go to **API permissions** from the left menu.
    - Click **Add a permission**.
    - Select **Microsoft Graph**.
    - Add the following **Delegated permissions**:
      - Sites.Read.All
      - Sites.ReadWrite.All
      - Sites.Manage.All
      - Files.ReadWrite.All
      - openid
      - email
      - profile
      - offline_access
    - Click **Add permissions**.
12. Copy your **Client ID** and **Client Secret**.
`

export const microsoftSharePointAuth = PieceAuth.OAuth2({
  description: authDesc,
  authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
  tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
  required: true,
  scope: [
    'openid',
    'email',
    'profile',
    'offline_access',
    'Sites.Read.All',
    'Sites.ReadWrite.All',
    'Sites.Manage.All',
    'Files.ReadWrite.All',
  ],
  prompt: 'omit'
});

export const microsoftSharePoint = createPiece({
  displayName: 'Microsoft SharePoint',
  auth: microsoftSharePointAuth,
  minimumSupportedRelease: '0.27.1',
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