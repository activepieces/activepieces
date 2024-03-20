import { createPiece, PieceAuth, PiecePropValueSchema } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { createChannelAction } from './lib/actions/create-channel';
import { sendChannelMessageAction } from './lib/actions/send-channel-message';
import { Client } from '@microsoft/microsoft-graph-client';
import { sendChatMessageAction } from './lib/actions/send-chat-message';

export const microsoftTeamsAuth = PieceAuth.OAuth2({
	required: true,
	scope: [
		'openid',
		'email',
		'profile',
		'offline_access',
		'Channel.Create',
		'Channel.ReadBasic.All',
		'ChannelMessage.Send',
		'Team.ReadBasic.All',
		'Chat.ReadWrite',
	],
	authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
	tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
	validate: async ({ auth }) => {
		try {
			const authValue = auth as PiecePropValueSchema<typeof microsoftTeamsAuth>;
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

export const microsoftTeams = createPiece({
	displayName: 'Microsoft Teams',
	auth: microsoftTeamsAuth,
	minimumSupportedRelease: '0.20.0',
	logoUrl: 'https://cdn.activepieces.com/pieces/microsoft-teams.png',
	categories: [PieceCategory.BUSINESS_INTELLIGENCE, PieceCategory.COMMUNICATION],
	authors: ['kishanprmr'],
	actions: [createChannelAction, sendChannelMessageAction, sendChatMessageAction],
	triggers: [],
});
