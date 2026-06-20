import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

// Each value is a SPACE-separated scope string (the format the OAuth2 `scope`
// query param expects). Every preset includes:
//   - offline_access  -> so the connection always receives a refresh token
//   - User.Read.All    -> so the validate() call against /me always succeeds
// The Azure app registration must still expose the full superset of these
// permissions; the preset only narrows what is *requested* at connection time.
// Tiers are additive: each includes the scopes of the tier above it.
const PERMISSION_PRESETS = {
  readOnly: 'User.Read.All Directory.Read.All offline_access',
  userManagement:
    'User.Read.All User.ReadWrite.All User.RevokeSessions.All Directory.Read.All offline_access',
  userGroupManagement:
    'User.Read.All User.ReadWrite.All User.RevokeSessions.All Group.ReadWrite.All Directory.Read.All offline_access',
  fullManagement:
    'User.Read.All User.ReadWrite.All Group.ReadWrite.All Directory.Read.All LicenseAssignment.ReadWrite.All User.RevokeSessions.All offline_access',
} as const;

const authDescription = `
If you'd like to use your own custom Azure app instead of the default app, follow the [Azure app creation guide](https://learn.microsoft.com/en-us/entra/identity-platform/quickstart-register-app#register-an-application),
 set the **Redirect URI** to {{redirectUrl}} and add the following **Microsoft Graph (Delegated) permissions** under **API permissions** (the app must expose the full set; the **Permissions** dropdown below only controls which of them are requested per connection):
  - User.Read.All
  - User.ReadWrite.All
  - Group.ReadWrite.All
  - Directory.Read.All
  - LicenseAssignment.ReadWrite.All
  - User.RevokeSessions.All
  - offline_access

The **Permissions** dropdown picks which of those scopes are requested for this connection. Tiers are additive (each includes everything above it); every tier also includes \`User.Read.All\` (so the connection can be validated) and \`offline_access\` (so it can refresh):
  - **Read only (users & directory)** — \`User.Read.All\`, \`Directory.Read.All\`
  - **User management** — adds \`User.ReadWrite.All\`, \`User.RevokeSessions.All\`
  - **User & group management** — adds \`Group.ReadWrite.All\`
  - **Full management (users, groups, licenses)** — adds \`LicenseAssignment.ReadWrite.All\`

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
    // This replaces the platform's built-in scope multiselect. Because `scope`
    // below is a single entry, `showScopeSelector` (scope.length > 1) is false,
    // so the built-in selector never renders. The selected value here is
    // substituted into the {permissions} placeholder when the authorization URL
    // is built, becoming the real OAuth2 `scope` param.
    permissions: Property.StaticDropdown({
      displayName: 'Permissions',
      description:
        'Choose the level of access to request. Tiers are additive - each ' +
        'includes everything below it. Group actions (create group, ' +
        'add/remove members) require "User & group management" or higher. ' +
        'All options include sign-in (offline_access) so the connection can ' +
        'refresh, and basic user read so the connection can be validated.',
      required: true,
      defaultValue: PERMISSION_PRESETS.fullManagement,
      options: {
        disabled: false,
        options: [
          { label: 'Read only (users & directory)', value: PERMISSION_PRESETS.readOnly },
          { label: 'User management', value: PERMISSION_PRESETS.userManagement },
          { label: 'User & group management', value: PERMISSION_PRESETS.userGroupManagement },
          { label: 'Full management (users, groups, licenses)', value: PERMISSION_PRESETS.fullManagement },
        ],
      },
    }),
  },
  // Single placeholder entry: hides the built-in multiselect AND is resolved
  // by the server via resolveValueFromProps(props, scope.join(' ')), replacing
  // {permissions} with the selected preset string.
  scope: ['{permissions}'],
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
