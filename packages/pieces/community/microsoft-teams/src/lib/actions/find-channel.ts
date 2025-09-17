import { microsoftTeamsAuth } from '../../';
import { createAction, Property } from '@activepieces/pieces-framework';
import { Client, PageCollection } from '@microsoft/microsoft-graph-client';
import { microsoftTeamsCommon } from '../common';

export const findChannelAction = createAction({
	auth: microsoftTeamsAuth,
	name: 'microsoft_teams_find_channel',
	displayName: 'Find Channel',
	description: 'Finds channels by name.',
	props: {
		teamId: microsoftTeamsCommon.teamId,
		channelName: Property.ShortText({
			displayName: 'Channel Name',
			required: true,
		}),
	},
	async run(context) {
		const { teamId, channelName } = context.propsValue;

		const client = Client.initWithMiddleware({
			authProvider: {
				getAccessToken: () => Promise.resolve(context.auth.access_token),
			},
		});

		const response: PageCollection = await client
			.api(`/teams/${teamId}/allChannels`)
			.filter(`displayName eq '${channelName}'`)
			.get();

		return {
			found: response.value.length > 0,
			result: response.value,
		};
	},
});
