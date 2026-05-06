import {
  PieceAuth,
  PiecePropValueSchema,
} from '@activepieces/pieces-framework';
import { microsoftCloudProperty } from './common/microsoft-cloud';
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
	- OnlineMeetingTranscript.Read.All
	- OnlineMeetingRecording.Read.All
	- openid
	- email
	- profile
	- offline_access`;

export const microsoftTeamsAuth = PieceAuth.OAuth2({
  description: authDesc,
  props: {
    cloud: microsoftCloudProperty,
  },
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
    // 'OnlineMeetings.Read',
    'OnlineMeetingTranscript.Read.All',
    'OnlineMeetingRecording.Read.All',
  ],
  prompt: 'omit',
  authUrl: 'https://{cloud}/common/oauth2/v2.0/authorize',
  tokenUrl: 'https://{cloud}/common/oauth2/v2.0/token',
  validate: async ({ auth }) => {
    try {
      const authValue = auth as PiecePropValueSchema<typeof microsoftTeamsAuth>;
      const cloud = authValue.props?.['cloud'] as string | undefined;
      const client = createGraphClient(authValue.access_token, cloud);
      await withGraphRetry(() => client.api('/me').get());
      return { valid: true };
    } catch (error) {
      return { valid: false, error: 'Invalid Credentials.' };
    }
  },
});
