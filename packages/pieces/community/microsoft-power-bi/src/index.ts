import {
  createPiece,
  OAuth2PropertyValue,
  PieceAuth,
} from '@activepieces/pieces-framework';
import { pushRowsToDatasetTableAction } from './lib/actions/push-rows-to-table';
import { createDatasetAction } from './lib/actions/create-dataset';
import { PieceCategory } from '@activepieces/shared';
import { createCustomApiCallAction } from '@activepieces/pieces-common';

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
    - Select **Power BI Service** → **Delegated permissions**.
    - Add the following scopes:
	    - Dataset.ReadWrite.All
	    - offline_access
    - Click **Add permissions**.
12. Copy your **Client ID** and **Client Secret**.
`

export const microsoftPowerBiAuth = PieceAuth.OAuth2({
  description: authDesc,
  authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
  tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
  required: true,
  scope: [
    'https://analysis.windows.net/powerbi/api/Dataset.ReadWrite.All',
    'offline_access',
  ],
  prompt: 'omit'
});

export const microsoftPowerBi = createPiece({
  displayName: 'Microsoft Power BI',
  description: 'Create and manage Power BI datasets and push data to them',
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/microsoft-power-bi.png',
  categories: [PieceCategory.BUSINESS_INTELLIGENCE],
  auth: microsoftPowerBiAuth,
  authors: ['calladodan'],
  actions: [
    createDatasetAction,
    pushRowsToDatasetTableAction,
    createCustomApiCallAction({
      auth: microsoftPowerBiAuth,
      baseUrl: () => 'https://api.powerbi.com/v1.0/myorg/datasets',
      authMapping: async (auth) => {
        return {
          Authorization: `Bearer ${(auth as OAuth2PropertyValue).access_token}`,
        };
      },
    }),
  ],
  triggers: [],
});
