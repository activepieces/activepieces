import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

const authDescription = `
If you'd like to use your own custom Azure app instead of the default app, follow the [Azure app creation guide](https://learn.microsoft.com/en-us/entra/identity-platform/quickstart-register-app#register-an-application),
 set the **Redirect URI** to {{redirectUrl}} and add the following **Microsoft Graph (Delegated) permissions** under **API permissions**:
  - User.Read.All
  - User.ReadWrite.All
  - Group.ReadWrite.All
  - Directory.Read.All
  - LicenseAssignment.ReadWrite.All
  - User.RevokeSessions.All
  - offline_access

Leave **Tenant ID** as \`common\` for the default multi-tenant flow, or set it to your Directory (tenant) ID if your app registration is single-tenant.`;

export const azureAdAuth = PieceAuth.OAuth2({
  description: authDescription,
  // The {tenantId} placeholder is substituted by Activepieces from the prop
  // below, the same mechanism the Microsoft SharePoint piece uses for {cloud}.
  authUrl: 'https://login.microsoftonline.com/{tenantId}/oauth2/v2.0/authorize',
  tokenUrl: 'https://login.microsoftonline.com/{tenantId}/oauth2/v2.0/token',
  required: true,
  props: {
    tenantId: Property.ShortText({
      displayName: 'Tenant ID',
      description:
        'Use "common" for the default multi-tenant flow, or your Directory ' +
        '(tenant) ID (a GUID) / "<name>.onmicrosoft.com" domain for a ' +
        'single-tenant app registration.',
      required: true,
      defaultValue: 'common',
    }),
  },
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