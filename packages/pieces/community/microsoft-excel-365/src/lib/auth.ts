import { PieceAuth } from '@activepieces/pieces-framework';
import { microsoftCloudProperty } from './common/microsoft-cloud';

const authDesc = `
If you'd like to use your own custom Azure app instead of the default app, follow the [Azure app creation guide](https://learn.microsoft.com/en-us/entra/identity-platform/quickstart-register-app#register-an-application),
 set the **Redirect URI** to {{redirectUrl}} and add the following **Microsoft Graph (Delegated) permissions** under **API permissions**:
 - Files.ReadWrite
 - Sites.ReadWrite.All
 - offline_access`;

export const excelAuth = PieceAuth.OAuth2({
  description: authDesc,
  props: {
    cloud: microsoftCloudProperty,
  },
  authUrl: 'https://{cloud}/common/oauth2/v2.0/authorize',
  tokenUrl: 'https://{cloud}/common/oauth2/v2.0/token',
  required: true,
  scope: ['Files.ReadWrite', 'Sites.ReadWrite.All', 'offline_access'],
  prompt: 'omit',
});
