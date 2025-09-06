import { microsoftTeamsAuth } from '../../';
import { createAction, Property } from '@activepieces/pieces-framework';
import { Client } from '@microsoft/microsoft-graph-client';
import { microsoftTeamsCommon } from '../common';

export const findChannelAction = createAction({
	auth: microsoftTeamsAuth,
	name: 'microsoft_teams_find_channel',
	displayName: 'Find Channel',
	description: 'Retrieve the properties of a channel in a team.',
	props: {
		teamId: microsoftTeamsCommon.teamId,
		channelId: microsoftTeamsCommon.channelId,
		select: Property.ShortText({
			displayName: 'Select (optional)',
			required: false,
			description: 'Comma-separated fields to select for better performance (e.g., id,displayName,webUrl).',
		}),
	},
	async run(context) {
		const { teamId, channelId, select } = context.propsValue;

		const client = Client.initWithMiddleware({
			authProvider: {
				getAccessToken: () => Promise.resolve(context.auth.access_token),
			},
		});

		let request = client.api(`/teams/${teamId}/channels/${channelId}`);
		if (select && String(select).trim().length > 0) {
			request = request.select(String(select));
		}
		return await request.get();
	},
});


