import { microsoftTeamsAuth } from '../auth';
import { createAction, Property } from '@activepieces/pieces-framework';
import { microsoftTeamsProps } from '../common/props';
import { microsoftTeamsClient } from '../common/client';
import type { ConversationMember, MicrosoftTeamsPage } from '../common/types';
import { microsoftTeamsFindTeamMemberOutputSchema } from '../output-schemas';

export const findTeamMemberAction = createAction({
	auth: microsoftTeamsAuth,
	name: 'microsoft_teams_find_team_member',
	outputSchema: microsoftTeamsFindTeamMemberOutputSchema,
	classification: 'SEARCH',
	displayName: 'Find Team Member',
	description: 'Finds a team member by email or display name.',
	audience: 'human',
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
			display: 'cards',
			options: {
				disabled: false,
				options: [
					{ label: 'Email', value: 'email', description: 'Exact email', icon: 'inbox' },
					{ label: 'Name', value: 'name', description: 'Display name', icon: 'user' },
				],
			},
		}),
		searchValue: Property.ShortText({
			displayName: 'Search Value',
			required: true,
			description: 'The exact email address or display name to match.',
		}),
	},
	async run(context) {
		const { teamId, searchBy, searchValue } = context.propsValue;

		const client = microsoftTeamsClient.create({ auth: context.auth });

		const escapedSearchValue = searchValue.replace(/'/g, "''");
		const filter = searchBy === 'email' ? `microsoft.graph.aadUserConversationMember/email eq '${escapedSearchValue}'` : `microsoft.graph.aadUserConversationMember/displayName eq '${escapedSearchValue}'`;

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


