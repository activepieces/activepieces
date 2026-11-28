import { microsoftTeamsAuth } from '../auth';
import { createAction, Property } from '@activepieces/pieces-framework';
import { microsoftTeamsProps } from '../common/props';
import { microsoftTeamsClient } from '../common/client';
import { microsoftTeamsCreatePrivateChannelOutputSchema } from '../output-schemas';

export const createPrivateChannelAction = createAction({
	auth: microsoftTeamsAuth,
	name: 'microsoft_teams_create_private_channel',
	outputSchema: microsoftTeamsCreatePrivateChannelOutputSchema,
	classification: 'WRITE',
	displayName: 'Create Private Channel',
	description: 'Creates a private channel that only invited members can see.',
	audience: 'human',
	aiMetadata: {
		description: 'Creates a new private (membership-restricted) channel inside a Microsoft Teams team, identified by team ID, with a display name and optional description. Use when access should be limited to specific members; for a standard open channel use Create Channel instead. Not idempotent — each call adds another channel.',
		idempotent: false,
	},
	props: {
		teamId: microsoftTeamsProps.teamId({ required: true }),
		channelDisplayName: Property.ShortText({
			displayName: 'Channel Name',
			required: true,
			placeholder: 'Marketing',
		}),
		channelDescription: Property.LongText({
			displayName: 'Description',
			description: 'Shown under the channel name in Teams.',
			required: false,
		}),
	},
	async run(context) {
		const { teamId, channelDescription, channelDisplayName } = context.propsValue;

		const client = microsoftTeamsClient.create({ auth: context.auth });

		const channel = {
			displayName: channelDisplayName,
			description: channelDescription,
			membershipType: 'private',
		};

		return await microsoftTeamsClient.withRetry(() => client.api(`/teams/${teamId}/channels`).post(channel));
	},
});


