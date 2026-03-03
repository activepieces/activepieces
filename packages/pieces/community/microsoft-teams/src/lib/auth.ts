import {
  PieceAuth,
  PiecePropValueSchema,
} from '@activepieces/pieces-framework';
import { createGraphClient, withGraphRetry } from './common/graph';

const authDesc = `
If you'd like to use your own custom Azure app instead of the default Activepieces app, follow the [Azure app creation guide](https://learn.microsoft.com/en-us/entra/identity-platform/quickstart-register-app#register-an-application),
 set the **Redirect URI** to {{redirectUrl}} and add the following **Microsoft Graph (Delegated) permissions** under **API permissions**:
  - User.Read
	- Channel.Create
	- Channel.ReadBasic.All
	- ChannelMessage.Send
	- Team.ReadBasic.All
	- Chat.ReadWrite
	- ChannelMessage.Read.All
	- User.ReadBasic.All
	- Presence.Read.All
	- TeamMember.Read.All
	- openid
	- email
	- profile
	- offline_access`;

export const microsoftTeamsAuth = PieceAuth.OAuth2({
  description: authDesc,
  required: true,
  scope: [
    'openid',
    'email',
    'profile',
    'offline_access',
    'User.Read',
    'Channel.Create',
    'Channel.ReadBasic.All',
    'ChannelMessage.Send',
    'Team.ReadBasic.All',
    'Chat.ReadWrite',
    'ChannelMessage.Read.All',
    'TeamMember.Read.All',
    'User.ReadBasic.All',
    'Presence.Read.All',
  ],
  prompt: 'omit',
  authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
  tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
  validate: async ({ auth }) => {
    try {
      const authValue = auth as PiecePropValueSchema<typeof microsoftTeamsAuth>;
      const client = createGraphClient(authValue.access_token);
      await withGraphRetry(() => client.api('/me').get());
      return { valid: true };
    } catch (error) {
      return { valid: false, error: 'Invalid Credentials.' };
    }
  },
});
