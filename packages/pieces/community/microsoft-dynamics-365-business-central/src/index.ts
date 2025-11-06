import {
  createPiece,
  OAuth2PropertyValue,
  PieceAuth,
  Property,
} from '@activepieces/pieces-framework';
import { createRecordAction } from './lib/actions/create-record.action';
import { getRecordAction } from './lib/actions/get-record.action';
import { updateRecordAction } from './lib/actions/update-record.action';
import { deleteRecordAction } from './lib/actions/delete-record.action';
import { newOrUpdatedRecordTrigger } from './lib/triggers/new-or-updated-record.trigger';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { searchRecordsAction } from './lib/actions/search-records.action';
import { PieceCategory } from '@activepieces/shared';


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
    - Select **Dynamics 365 Business Central** → **Delegated permissions**.
    - Add the following scopes:
      - Financials.ReadWrite.All
      - user_impersonation
    - Click **Add permissions**.
12. Copy your **Client ID** and **Client Secret**.
`

export const businessCentralAuth = PieceAuth.OAuth2({
  description:authDesc,
  props: {
    environment: Property.ShortText({
      displayName: 'Environment',
      description: `Name of the environment to connect to, e.g. 'Production' or 'Sandbox'. Environment names can be found in the Business Central Admin Center.`,
      required: true,
      defaultValue: 'Production',
    }),
  },
  required: true,
  scope: [
    'https://api.businesscentral.dynamics.com/user_impersonation',
    'https://api.businesscentral.dynamics.com/Financials.ReadWrite.All',
  ],
  prompt: 'omit',
  authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
  tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
});

export const microsoftDynamics365BusinessCentral = createPiece({
  displayName: 'Microsoft Dynamics 365 Business Central',
  auth: businessCentralAuth,
  description: 'All-in-one business management solution by Microsoft.',
  categories: [PieceCategory.SALES_AND_CRM],
  minimumSupportedRelease: '0.27.1',
  logoUrl:
    'https://cdn.activepieces.com/pieces/microsoft-dynamics-365-business-central.png',
  authors: ['kishanprmr'],
  actions: [
    createRecordAction,
    deleteRecordAction,
    getRecordAction,
    updateRecordAction,
    searchRecordsAction,
    createCustomApiCallAction({
      auth: businessCentralAuth,
      baseUrl: (auth) => {
        return `https://api.businesscentral.dynamics.com/v2.0/${
          (auth as OAuth2PropertyValue).props?.['environment']
        }/api/v2.0`;
      },
      authMapping: async (auth) => ({
        Authorization: `Bearer  ${(auth as OAuth2PropertyValue).access_token}`,
      }),
    }),
  ],
  triggers: [newOrUpdatedRecordTrigger],
});
