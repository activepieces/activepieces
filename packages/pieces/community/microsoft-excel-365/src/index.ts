import { createCustomApiCallAction } from '@activepieces/pieces-common';
import {
  createPiece,
  OAuth2PropertyValue,
  PieceAuth,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';


import { addWorksheetAction } from './lib/actions/add-worksheet';
import { appendRowAction } from './lib/actions/append-row';
import { appendTableRowsAction } from './lib/actions/append-table-rows';
import { clearWorksheetAction } from './lib/actions/clear-worksheet';
import { convertToRangeAction } from './lib/actions/convert-to-range';
import { createTableAction } from './lib/actions/create-table';
import { createWorkbook } from './lib/actions/create-workbook';
import { deleteTableAction } from './lib/actions/delete-table';
import { deleteWorkbookAction } from './lib/actions/delete-workbook';
import { deleteWorksheetAction } from './lib/actions/delete-worksheet';
import { getTableColumnsAction } from './lib/actions/get-table-columns';
import { getTableRowsAction } from './lib/actions/get-table-rows';
import { getWorkbooksAction } from './lib/actions/get-workbooks';
import { getWorksheetRowsAction } from './lib/actions/get-worksheet-rows';
import { getWorksheetsAction } from './lib/actions/get-worksheets';
import { lookupTableColumnAction } from './lib/actions/lookup-table-column';
import { updateRowAction } from './lib/actions/update-row';


import { clearRangeAction} from './lib/actions/clear-cells-by-range';
import { clearColumnAction } from './lib/actions/clear-column-by-index';
import { clearRowAction } from './lib/actions/clear-row-by-id';
import { createWorksheetAction } from './lib/actions/create-worksheet';
import { findRowAction} from './lib/actions/find-row';
import { getRangeAction } from './lib/actions/get-cells-in-range';
import { getRowAction } from './lib/actions/get-row-by-id';
import { getWorksheetAction } from './lib/actions/get-worksheet-by-id';
import { renameWorksheetAction} from './lib/actions/rename-worksheet';


import { readNewRows } from './lib/trigger/new-row-added';


import { newRowInTableTrigger } from './lib/trigger/new-row-in-table';
import { newWorksheetTrigger } from './lib/trigger/new-worksheet';
import { updatedRowTrigger } from './lib/trigger/updated-row';


import { excelCommon } from './lib/common/common';
import { get } from 'http';

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
    - Select **Microsoft Graph** → **Delegated permissions**.
    - Add the following scopes:
      - Files.ReadWrite
      - offline_access
    - Click **Add permissions**.
12. Copy your **Client ID** and **Client Secret**.
`

export const excelAuth = PieceAuth.OAuth2({
  description: authDesc,
  authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
  tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
  required: true,
  scope: ['Files.ReadWrite', 'offline_access'],
  prompt: 'omit'
});

export const microsoftExcel = createPiece({
  displayName: 'Microsoft Excel 365',
  description: 'Spreadsheet software by Microsoft',

  auth: excelAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/microsoft-excel-365.png',
  categories: [PieceCategory.PRODUCTIVITY],
  authors: ["BastienMe","kishanprmr","MoShizzle","abuaboud","Pranith124"],
  actions: [
    appendRowAction,
    getWorksheetsAction,
    getWorksheetRowsAction,
    updateRowAction,
    clearWorksheetAction,
    deleteWorksheetAction,
    getWorkbooksAction,
    deleteWorkbookAction,
    addWorksheetAction,
    getTableRowsAction,
    getTableColumnsAction,
    createTableAction,
    deleteTableAction,
    lookupTableColumnAction,
    appendTableRowsAction,
    convertToRangeAction,
    createWorkbook,
    clearColumnAction,
    clearRangeAction,
    clearRowAction,
    createWorksheetAction,
    findRowAction,
    getRangeAction,
    getRowAction,
    getWorksheetAction,
    renameWorksheetAction,
    createCustomApiCallAction({
      baseUrl: () => excelCommon.baseUrl,
      auth: excelAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${(auth as OAuth2PropertyValue).access_token}`,
      }),
    }),
  ],
  triggers: [
    readNewRows,
    newRowInTableTrigger,
    newWorksheetTrigger,
    updatedRowTrigger,
  ],
});