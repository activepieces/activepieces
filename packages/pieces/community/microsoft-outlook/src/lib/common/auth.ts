import { OAuth2PropertyValue, PieceAuth } from '@activepieces/pieces-framework';
import { Client } from '@microsoft/microsoft-graph-client';

const authDesc = `
If you’d like to use your own custom Azure app instead of the default Activepieces app, follow the [Azure app creation guide](https://learn.microsoft.com/en-us/entra/identity-platform/quickstart-register-app#register-an-application),
 set the **Redirect URI** to {{redirectUrl}} and add the following **Microsoft Graph (Delegated) permissions** under **API permissions**:
 - User.Read
 - Mail.ReadWrite
 - Mail.Send
 - Calendars.Read
 - offline_access
`;

export const microsoftOutlookAuth = PieceAuth.OAuth2({
  description: authDesc,
  authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
  tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
  required: true,
  scope: [
    'Mail.ReadWrite',
    'Mail.Send',
    'Calendars.Read',
    'offline_access',
    'User.Read',
  ],
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
