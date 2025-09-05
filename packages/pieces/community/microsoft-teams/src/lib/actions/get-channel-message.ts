import { microsoftTeamsAuth } from '../..';
import { createAction, Property } from '@activepieces/pieces-framework';
import { Client } from '@microsoft/microsoft-graph-client';
import { microsoftTeamsCommon } from '../common';

export const getChannelMessage = createAction({
	auth: microsoftTeamsAuth,
	name: 'microsoft_teams_get_channel_message',
	displayName: 'Get Channel Message',
	description: 'Fetches a specific message from a Microsoft Teams channel.',
	props: {
		teamId: microsoftTeamsCommon.teamId,
		channelId: microsoftTeamsCommon.channelId,
		messageId: Property.ShortText({
			displayName: 'Message ID',
			description: 'The ID of the message to retrieve',
			required: true,
		}),
	},
	async run(context) {
		const { teamId, channelId, messageId } = context.propsValue;

		const client = Client.initWithMiddleware({
			authProvider: {
				getAccessToken: () => Promise.resolve(context.auth.access_token),
			},
		});

		// https://learn.microsoft.com/en-us/graph/api/channel-get-message?view=graph-rest-1.0&tabs=http
		return await client.api(`/teams/${teamId}/channels/${channelId}/messages/${messageId}`).get();
	},
});
