import { OAuth2PropertyValue, PieceAuth } from '@activepieces/pieces-framework';
import { Client } from '@microsoft/microsoft-graph-client';

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
      - Mail.ReadWrite
      - Mail.Send
	  - Calendars.Read
	  - offline_access
	  - User.Read
    - Click **Add permissions**.
12. Copy your **Client ID** and **Client Secret**.
`

export const microsoftOutlookAuth = PieceAuth.OAuth2({
	description:authDesc,
	authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
	tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
	required: true,
	scope: ['Mail.ReadWrite', 'Mail.Send', 'Calendars.Read', 'offline_access', 'User.Read'],
	prompt: 'omit',
	validate: async ({ auth }) => {
		try {
			const authValue = auth as OAuth2PropertyValue;
			const client = Client.initWithMiddleware({
				authProvider: {
					getAccessToken: () => Promise.resolve(authValue.access_token),
				},
			});
			await client.api('/me').get();
			return { valid: true };
		} catch (error) {
			return { valid: false, error: 'Invalid Credentials.' };
		}
	},
});
