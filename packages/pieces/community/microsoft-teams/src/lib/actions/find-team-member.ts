import { microsoftTeamsAuth } from '../../';
import { createAction, Property } from '@activepieces/pieces-framework';
import { Client } from '@microsoft/microsoft-graph-client';
import { microsoftTeamsCommon } from '../common';

export const findTeamMemberAction = createAction({
	auth: microsoftTeamsAuth,
	name: 'microsoft_teams_find_team_member',
	displayName: 'Find Team Member',
	description: 'Find a team member by email or name.',
	props: {
		teamId: microsoftTeamsCommon.teamId,
		searchType: Property.StaticDropdown({
			displayName: 'Search Type',
			description: 'How to search for the team member',
			required: true,
			defaultValue: 'email',
			options: {
				disabled: false,
				options: [
					{
						label: 'By Email',
						value: 'email',
					},
					{
						label: 'By Name',
						value: 'name',
					},
				],
			},
		}),
		searchValue: Property.ShortText({
			displayName: 'Search Value',
			description: 'Email address or display name to search for',
			required: true,
		}),
	},
	async run(context) {
		const { teamId, searchType, searchValue } = context.propsValue;

		const client = Client.initWithMiddleware({
			authProvider: {
				getAccessToken: () => Promise.resolve(context.auth.access_token),
			},
		});

		// Get all team members
		const membersResponse = await client.api(`/teams/${teamId}/members`).get();
		const members = membersResponse.value;

		// Search for the member based on search type
		let foundMember = null;
		
		if (searchType === 'email') {
			// First try to find by email in the members list
			foundMember = members.find((member: any) => 
				member.email && member.email.toLowerCase() === searchValue.toLowerCase()
			);
			
			// If not found by email in members, try to get user by email and find matching userId
			if (!foundMember) {
				try {
					const user = await client.api(`/users/${searchValue}`).get();
					foundMember = members.find((member: any) => member.userId === user.id);
				} catch (error) {
					// User not found or not accessible
				}
			}
		} else if (searchType === 'name') {
			// Search by display name (case-insensitive partial match)
			foundMember = members.find((member: any) => 
				member.displayName && 
				member.displayName.toLowerCase().includes(searchValue.toLowerCase())
			);
		}

		if (!foundMember) {
			throw new Error(`Team member not found with ${searchType}: ${searchValue}`);
		}

		// Get detailed member information using the member ID
		return await client.api(`/teams/${teamId}/members/${foundMember.id}`).get();
	},
});