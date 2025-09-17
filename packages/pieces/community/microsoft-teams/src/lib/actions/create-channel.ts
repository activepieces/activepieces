import { microsoftTeamsAuth } from '../../';
import { createAction, Property } from '@activepieces/pieces-framework';
import { microsoftTeamsCommon } from '../common';
import { createGraphClient, withGraphRetry } from '../common/graph';

export const createChannelAction = createAction({
	auth: microsoftTeamsAuth,
	name: 'microsoft_teams_create_channel',
	displayName: 'Create Channel',
	description: 'Create a new channel in Microsoft Teams.',
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

		const client = createGraphClient(context.auth.access_token);

		const channel = {
			displayName: channelDisplayName,
			description: channelDescription,
		};

		return await withGraphRetry(() => client.api(`/teams/${teamId}/channels`).post(channel));
	},
});
