import {
	createPiece,
	PieceAuth,
	PiecePropValueSchema,
	OAuth2PropertyValue,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { createChannelAction } from './lib/actions/create-channel';
import { sendChannelMessageAction } from './lib/actions/send-channel-message';
import { sendChatMessageAction } from './lib/actions/send-chat-message';
import { replyToChannelMessageAction } from './lib/actions/reply-to-channel-message';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { newChannelMessageTrigger } from './lib/triggers/new-channel-message';
import { newChannelTrigger } from './lib/triggers/new-channel';
import { newChatTrigger } from './lib/triggers/new-chat';
import { newChatMessageTrigger } from './lib/triggers/new-chat-message';
import { createChatAndSendMessageAction } from './lib/actions/create-chat-and-send-message';
import { createPrivateChannelAction } from './lib/actions/create-private-channel';
import { getChatMessageAction } from './lib/actions/get-chat-message';
import { getChannelMessageAction } from './lib/actions/get-channel-message';
import { findChannelAction } from './lib/actions/find-channel';
import { findTeamMemberAction } from './lib/actions/find-team-member';
import { createGraphClient, withGraphRetry } from './lib/common/graph';

const authDesc = `
1. Sign in to [Microsoft Azure Portal](https://portal.azure.com/).
2. From the left sidebar, go to **Microsoft Enfra ID**.
3. Under **Manage**, click on **App registrations**.
4. Click the **New registration** button.
5. Enter a **Name** for your app.
6. For **Supported account types**, choose:
   - **Accounts in any organizational directory (Any Microsoft Entra ID tenant - Multitenant) and personal Microsoft accounts**
   - Or select based on your requirement.
7. In **Redirect URI**, select **Web** and add the given URL.
8. Click **Register**.
9. After registration, you’ll be redirected to the app’s overview page. Copy the **Application (client) ID**.
10. From the left menu, go to **Certificates & secrets**.
    - Under **Client secrets**, click **New client secret**.
    - Provide a description, set an expiry, and click **Add**.
    - Copy the **Value** of the client secret (this will not be shown again).
11. Go to **API permissions** from the left menu.
    - Click **Add a permission**.
    - Select **Microsoft Graph** → **Delegated permissions**.
    - Add the following scopes:
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
	  - offline_access
    - Click **Add permissions**.
12. Copy your **Client ID** and **Client Secret**.
`

export const microsoftTeamsAuth = PieceAuth.OAuth2({
	description:authDesc,
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

export const microsoftTeams = createPiece({
	displayName: 'Microsoft Teams',
	auth: microsoftTeamsAuth,
	minimumSupportedRelease: '0.30.0',
	logoUrl: 'https://cdn.activepieces.com/pieces/microsoft-teams.png',
	categories: [PieceCategory.BUSINESS_INTELLIGENCE, PieceCategory.COMMUNICATION],
	authors: ['kishanprmr'],
	actions: [
		createChannelAction,
		sendChannelMessageAction,
		sendChatMessageAction,
		replyToChannelMessageAction,
		createChatAndSendMessageAction,
		createPrivateChannelAction,
		getChatMessageAction,
		getChannelMessageAction,
		findChannelAction,
		findTeamMemberAction,
		createCustomApiCallAction({
			auth: microsoftTeamsAuth,
			baseUrl: () => 'https://graph.microsoft.com/v1.0/teams',
			authMapping: async (auth) => ({
				Authorization: `Bearer ${(auth as OAuth2PropertyValue).access_token}`,
			}),
		}),
	],
	triggers: [newChannelMessageTrigger, newChannelTrigger, newChatTrigger, newChatMessageTrigger],
});
