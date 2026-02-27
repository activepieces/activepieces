import { PieceAuth } from '@activepieces/pieces-framework';

const authDesc = `
If you’d like to use your own custom Azure app instead of the default Activepieces app, follow the [Azure app creation guide](https://learn.microsoft.com/en-us/entra/identity-platform/quickstart-register-app#register-an-application),
 set the **Redirect URI** to {{redirectUrl}} and add the following **Microsoft Graph (Delegated) permissions** under **API permissions**:
 - User.Read
 - Notes.ReadWrite
 - offline_access`;

export const oneNoteAuth = PieceAuth.OAuth2({
  description: authDesc,
  authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
  tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
  required: true,
  scope: ['Notes.ReadWrite', 'User.Read', 'offline_access'],
  prompt: 'omit',
});
