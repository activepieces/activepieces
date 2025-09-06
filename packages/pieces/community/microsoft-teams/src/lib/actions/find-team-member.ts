import { microsoftTeamsAuth } from '../../';
import { createAction, Property } from '@activepieces/pieces-framework';
import { Client, PageCollection } from '@microsoft/microsoft-graph-client';
import { microsoftTeamsCommon } from '../common';

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
		query: Property.ShortText({
			displayName: 'Query',
			required: true,
			description: 'Email address or name to search for.',
		}),
	},
	async run(context) {
		const { teamId, searchBy, query } = context.propsValue as { teamId: string; searchBy: 'email'|'name'; query: string };

		const client = Client.initWithMiddleware({
			authProvider: {
				getAccessToken: () => Promise.resolve(context.auth.access_token),
			},
		});

		const normalizedQuery = String(query).trim().toLowerCase();
		const matches: any[] = [];

		// List team members with pagination
		// https://learn.microsoft.com/graph/api/team-list-members?view=graph-rest-1.0
		let response: PageCollection = await client.api(`/teams/${teamId}/members`).get();
		while (response.value && response.value.length > 0) {
			for (const member of response.value as any[]) {
				const displayName: string = (member.displayName ?? '').toLowerCase();
				const email: string = (member.email ?? '').toLowerCase();
				const isMatch = searchBy === 'email'
					? email === normalizedQuery || email.includes(normalizedQuery)
					: displayName === normalizedQuery || displayName.includes(normalizedQuery);
				if (isMatch) {
					matches.push(member);
				}
			}
			if (response['@odata.nextLink']) {
				response = await client.api(response['@odata.nextLink']).get();
			} else {
				break;
			}
		}

		return {
			bestMatch: matches[0] ?? null,
			matches,
		};
	},
});


