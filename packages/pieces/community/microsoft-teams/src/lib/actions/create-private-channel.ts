import { microsoftTeamsAuth } from '../auth';
import { createAction, Property } from '@activepieces/pieces-framework';
import { microsoftTeamsCommon } from '../common';
import { createGraphClient, withGraphRetry } from '../common/graph';

export const createPrivateChannelAction = createAction({
	auth: microsoftTeamsAuth,
	name: 'microsoft_teams_create_private_channel',
	displayName: 'Create Private Channel',
	description: 'Create a new private channel in a team.',
	props: {
		teamId: microsoftTeamsCommon.teamId,
		channelDisplayName: Property.ShortText({
			displayName: 'Channel Name',
			required: true,
		}),
		channelDescription: Property.LongText({
			displayName: 'Channel Description',
			required: false,
		}),
	},
	async run(context) {
		const { teamId, channelDescription, channelDisplayName } = context.propsValue;

		const cloud = context.auth.props?.['cloud'] as string | undefined;
		const client = createGraphClient(context.auth.access_token, cloud);

		const channel = {
			displayName: channelDisplayName,
			description: channelDescription,
			membershipType: 'private',
		};

		// https://learn.microsoft.com/graph/api/channel-post?view=graph-rest-1.0
		return await withGraphRetry(() => client.api(`/teams/${teamId}/channels`).post(channel));
	},
});


