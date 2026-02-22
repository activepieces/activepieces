import { PieceAuth, Property } from '@activepieces/pieces-framework';

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
9. After registration, you'll be redirected to the app's overview page. Copy the **Application (client) ID**.
10. From the left menu, go to **Certificates & secrets**.
    - Under **Client secrets**, click **New client secret**.
    - Provide a description, set an expiry, and click **Add**.
    - Copy the **Value** of the client secret (this will not be shown again).
11. Go to **API permissions** from the left menu.
    - Click **Add a permission**.
    - Select **Dynamics CRM** → **Delegated permissions**.
    - Click **Add permissions**.
12. Copy your **Client ID** and **Client Secret**.
`;

export const dynamicsCRMAuth = PieceAuth.OAuth2({
  description:authDesc,
  props: {
    hostUrl: Property.ShortText({
      displayName: 'Host URL (without trailing slash)',
      description:
        'Host URL without trailing slash.For example **https://demo.crm.dynamics.com**',
      required: true,
    }),
    tenantId: Property.ShortText({
      displayName: 'Tenant ID',
      description: 'You can find this in the Azure portal.',
      defaultValue: 'common',
      required: true,
    }),
    proxyUrl: Property.ShortText({
      displayName: 'Proxy URL with Port',
      description:
        'Keep empty if not needed. Optional proxy URL used for establishing connections when proxying requests is needed. For example: **https://proxy.com:8080**.',
      required: false,
    }),
  },
  required: true,
  scope: ['{hostUrl}/.default', 'openid', 'email', 'profile', 'offline_access'],
  prompt: 'omit',
  authUrl: 'https://login.microsoftonline.com/{tenantId}/oauth2/v2.0/authorize',
  tokenUrl: 'https://login.microsoftonline.com/{tenantId}/oauth2/v2.0/token',
});
