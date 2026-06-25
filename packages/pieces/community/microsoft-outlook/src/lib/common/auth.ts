import { OAuth2PropertyValue, PieceAuth, Property } from '@activepieces/pieces-framework';
import { microsoftCloudProperty, microsoftScopeProperty } from './microsoft-cloud';
import { outlookCommon } from './client';

const authDesc = `
This connection supports two access modes. Pick the matching **Grant Type** and **Access Mode** below.

**Delegated (Authorization Code)** — acts as the signed-in user. Keep **Access Mode** on the Delegated option, leave **Mailbox** blank, and keep **Tenant ID** as \`common\`. If you use your own Azure app, follow the [Azure app creation guide](https://learn.microsoft.com/en-us/entra/identity-platform/quickstart-register-app#register-an-application), set the **Redirect URI** to {{redirectUrl}} and add these **Microsoft Graph (Delegated) permissions**:
 - User.Read
 - Mail.ReadWrite
 - Mail.Send
 - Calendars.Read
 - offline_access

**App-only (Client Credentials)** — acts as the application, with no signed-in user. Set **Access Mode** to the App-only option for your cloud, set **Tenant ID** to your Directory (tenant) ID, and set **Mailbox** to the target user's email/UPN or object ID. You must register your own Azure app (the shared app cannot grant app-only access to your tenant). Add these **Microsoft Graph (Application) permissions** and **grant admin consent**:
 - Mail.ReadWrite
 - Mail.Send

For app-only, Microsoft grants tenant-wide mailbox access by default — scope it to specific mailboxes with an [ApplicationAccessPolicy](https://learn.microsoft.com/en-us/graph/auth-limit-mailbox-access).
`;

export const microsoftOutlookAuth = PieceAuth.OAuth2({
  description: authDesc,
  grantType: 'both_client_credentials_and_authorization_code',
  props: {
    cloud: microsoftCloudProperty,
    accessMode: microsoftScopeProperty,
    tenant: Property.ShortText({
      displayName: 'Tenant ID',
      description:
        'Use "common" for the default delegated multi-tenant flow. For app-only (Client Credentials), set this to your Directory (tenant) ID.',
      required: true,
      defaultValue: 'common',
    }),
    mailbox: Property.ShortText({
      displayName: 'Mailbox (App-only)',
      description:
        'Email/UPN or user object ID of the mailbox to act on. Required for app-only (Client Credentials). Leave blank for delegated access (acts as the signed-in user).',
      required: false,
    }),
  },
  authUrl: 'https://{cloud}/{tenant}/oauth2/v2.0/authorize',
  tokenUrl: 'https://{cloud}/{tenant}/oauth2/v2.0/token',
  required: true,
  scope: ['{accessMode}'],
  prompt: 'omit',
  validate: async ({ auth }) => {
    try {
      const authValue = auth as OAuth2PropertyValue;
      const client = outlookCommon.createClient(authValue);
      await client.api(outlookCommon.mailboxPrefix(authValue)).get();
      return { valid: true };
    } catch (error) {
      return { valid: false, error: 'Invalid Credentials.' };
    }
  },
});
