import { microsoftTeamsAuth } from '../auth';
import { createAction, Property } from '@activepieces/pieces-framework';
import { microsoftTeamsProps } from '../common/props';
import { microsoftTeamsClient } from '../common/client';
import type { Channel, MicrosoftTeamsPage } from '../common/types';
import { microsoftTeamsFindChannelOutputSchema } from '../output-schemas';

export const findChannelAction = createAction({
	auth: microsoftTeamsAuth,
	name: 'microsoft_teams_find_channel',
	outputSchema: microsoftTeamsFindChannelOutputSchema,
	classification: 'SEARCH',
	displayName: 'Find Channel',
	description: 'Finds channels by name.',
	audience: 'human',
	aiMetadata: {
		description: 'Searches the channels of a Microsoft Teams team (by team ID) for ones whose display name exactly matches the given name. Use to resolve a channel name to its ID before posting or reading. Idempotent read-only lookup; match is exact, not a substring search.',
		idempotent: true,
	},
	props: {
		teamId: microsoftTeamsProps.teamId({ required: true }),
		channelName: Property.ShortText({
			displayName: 'Channel Name',
			required: true,
		}),
	},
	async run(context) {
		const { teamId, channelName } = context.propsValue;

		const client = microsoftTeamsClient.create({ auth: context.auth });

		const response: MicrosoftTeamsPage<Channel> = await client
			.api(`/teams/${teamId}/allChannels`)
			.filter(`displayName eq '${channelName}'`)
			.get();

		return {
			found: response.value.length > 0,
			result: response.value,
		};
	},
});
