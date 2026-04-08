import { microsoftTeamsAuth } from '../auth';
import { createAction, Property } from '@activepieces/pieces-framework';
import { PageCollection } from '@microsoft/microsoft-graph-client';
import { microsoftTeamsCommon } from '../common';
import { createGraphClient } from '../common/graph';

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

		const cloud = context.auth.props?.['cloud'] as string | undefined;
		const client = createGraphClient(context.auth.access_token, cloud);

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
