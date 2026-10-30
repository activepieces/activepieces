import { microsoftTeamsAuth } from '../auth';
import { createAction, Property } from '@activepieces/pieces-framework';
import { microsoftTeamsProps } from '../common/props';
import { microsoftTeamsClient } from '../common/client';
import type { ConversationMember, MicrosoftTeamsPage } from '../common/types';

export const findTeamMemberAction = createAction({
	auth: microsoftTeamsAuth,
	name: 'microsoft_teams_find_team_member',
	classification: 'SEARCH',
	displayName: 'Find Team Member',
	description: 'Finds a team member by email or display name.',
	audience: 'both',
	aiMetadata: {
		description: 'Searches the members of a Microsoft Teams team (by team ID) for those matching a given email or display name, depending on the selected search mode. Use to resolve a person to their member record/ID before mentioning or messaging them. Idempotent read-only lookup; match is exact on the chosen field.',
		idempotent: true,
	},
	props: {
		teamId: microsoftTeamsProps.teamId({ required: true }),
		searchBy: Property.StaticDropdown({
			displayName: 'Search By',
			required: true,
			defaultValue: 'email',
			options: {
				disabled: false,
				options: [
					{ label: 'Email', value: 'email' },
					{ label: 'Name', value: 'name' },
				],
			},
		}),
		searchValue: Property.ShortText({
			displayName: 'searchValue',
			required: true,
			description: 'Email address or name to search for.',
		}),
	},
	async run(context) {
		const { teamId, searchBy, searchValue } = context.propsValue 

		const client = microsoftTeamsClient.create({ auth: context.auth });

		const filter = searchBy == 'email' ?`microsoft.graph.aadUserConversationMember/email eq '${searchValue}'`:`microsoft.graph.aadUserConversationMember/displayName eq  '${searchValue}'`;

		const response: MicrosoftTeamsPage<ConversationMember> = await client
			.api(`/teams/${teamId}/members`)
			.filter(filter)
			.get();

		return {
			found: response.value.length > 0,
			result: response.value,
		};
		
	},
});


