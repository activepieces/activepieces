import { PieceAuth } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

const authDescription = `
If you'd like to use your own custom Azure app instead of the default Activepieces app, follow the [Azure app creation guide](https://learn.microsoft.com/en-us/entra/identity-platform/quickstart-register-app#register-an-application),
 set the **Redirect URI** to {{redirectUrl}} and add the following **Microsoft Graph (Delegated) permissions** under **API permissions**:
  - User.Read.All
  - User.ReadWrite.All
  - Group.ReadWrite.All
  - Directory.Read.All
  - LicenseAssignment.ReadWrite.All
  - User.RevokeSessions.All
  - offline_access`;

export const azureAdAuth = PieceAuth.OAuth2({
  description: authDescription,
  authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
  tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
  required: true,
  scope: [
    'User.Read.All',
    'User.ReadWrite.All',
    'Group.ReadWrite.All',
    'Directory.Read.All',
    'LicenseAssignment.ReadWrite.All',
    'User.RevokeSessions.All',
    'offline_access',
  ],
  validate: async ({ auth }) => {
    try {
      // https://learn.microsoft.com/en-us/graph/api/user-get?view=graph-rest-1.0&tabs=http
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: 'https://graph.microsoft.com/v1.0/me',
        headers: { Authorization: `Bearer ${auth.access_token}` },
      });
      return { valid: true };
    } catch {
      return {
        valid: false,
        error: 'Invalid or expired token. Please reconnect.',
      };
    }
  },
});
