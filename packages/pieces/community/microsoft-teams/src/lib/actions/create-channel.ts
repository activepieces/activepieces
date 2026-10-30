import { microsoftTeamsAuth } from '../auth';
import { createAction, Property } from '@activepieces/pieces-framework';
import { microsoftTeamsProps } from '../common/props';
import { microsoftTeamsClient } from '../common/client';

export const createChannelAction = createAction({
	auth: microsoftTeamsAuth,
	name: 'microsoft_teams_create_channel',
	classification: 'WRITE',
	displayName: 'Create Channel',
	description: 'Create a new channel in Microsoft Teams.',
	audience: 'human',
	aiMetadata: {
		description: 'Creates a new standard channel inside a Microsoft Teams team, identified by team ID, with a display name and optional description. Use to provision a shared channel; for a members-restricted channel use Create Private Channel instead. Not idempotent — each call adds another channel even with the same name.',
		idempotent: false,
	},
	props: {
		teamId: microsoftTeamsProps.teamId({ required: true }),
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

		const client = microsoftTeamsClient.create({ auth: context.auth });

		const channel = {
			displayName: channelDisplayName,
			description: channelDescription,
		};

		return await client.api(`/teams/${teamId}/channels`).post(channel);
	},
});
