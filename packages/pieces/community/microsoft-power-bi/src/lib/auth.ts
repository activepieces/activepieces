import { PieceAuth } from '@activepieces/pieces-framework';

const authDesc = `If you'd like to use your own custom Azure app instead of the default Activepieces app, follow the [Azure app creation guide](https://learn.microsoft.com/en-us/entra/identity-platform/quickstart-register-app#register-an-application),
 set the **Redirect URI** to {{redirectUrl}} and add the following **Power BI Service (Delegated) permissions** under **API permissions**:
 - Dataset.ReadWrite.All
 - offline_access`;

export const microsoftPowerBiAuth = PieceAuth.OAuth2({
  description: authDesc,
  authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
  tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
  required: true,
  scope: [
    'https://analysis.windows.net/powerbi/api/Dataset.ReadWrite.All',
    'offline_access',
  ],
  prompt: 'omit',
});
