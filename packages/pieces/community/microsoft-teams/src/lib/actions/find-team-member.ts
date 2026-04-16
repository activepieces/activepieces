import { microsoftTeamsAuth } from '../auth';
import { createAction, Property } from '@activepieces/pieces-framework';
import { PageCollection } from '@microsoft/microsoft-graph-client';
import { microsoftTeamsCommon } from '../common';
import { createGraphClient } from '../common/graph';

export const findTeamMemberAction = createAction({
	auth: microsoftTeamsAuth,
	name: 'microsoft_teams_find_team_member',
	displayName: 'Find Team Member',
	description: 'Finds a team member by email or display name.',
	props: {
		teamId: microsoftTeamsCommon.teamId,
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

		const cloud = context.auth.props?.['cloud'] as string | undefined;
		const client = createGraphClient(context.auth.access_token, cloud);

		const filter = searchBy == 'email' ?`microsoft.graph.aadUserConversationMember/email eq '${searchValue}'`:`microsoft.graph.aadUserConversationMember/displayName eq  '${searchValue}'`;

		const response: PageCollection = await client
			.api(`/teams/${teamId}/members`)
			.filter(filter)
			.get();

		return {
			found: response.value.length > 0,
			result: response.value,
		};
		
	},
});


