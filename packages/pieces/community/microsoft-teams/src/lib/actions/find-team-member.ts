import { microsoftTeamsAuth } from '../..';
import { createAction, Property } from '@activepieces/pieces-framework';
import { Client, PageCollection } from '@microsoft/microsoft-graph-client';
import { microsoftTeamsCommon } from '../common';
import { ConversationMember } from '@microsoft/microsoft-graph-types';

// Extended interface to handle the expanded user data
interface ConversationMemberWithUser extends ConversationMember {
	user?: {
		mail?: string;
		userPrincipalName?: string;
	};
}

export const findTeamMember = createAction({
	auth: microsoftTeamsAuth,
	name: 'microsoft_teams_find_team_member',
	displayName: 'Find Team Member',
	description: 'Finds team members by email or name in a Microsoft Teams team.',
	props: {
		teamId: microsoftTeamsCommon.teamId,
		searchTerm: Property.ShortText({
			displayName: 'Search Term',
			description: 'The email or name to search for in team members',
			required: true,
		}),
		searchType: Property.StaticDropdown({
			displayName: 'Search Type',
			description: 'The type of search to perform',
			required: true,
			defaultValue: 'contains',
			options: {
				disabled: false,
				options: [
					{
						label: 'Contains',
						value: 'contains',
					},
					{
						label: 'Starts With',
						value: 'startsWith',
					},
					{
						label: 'Exact Match',
						value: 'exact',
					},
				],
			},
		}),
		searchFields: Property.StaticDropdown({
			displayName: 'Search Fields',
			description: 'Which fields to search in',
			required: true,
			defaultValue: 'both',
			options: {
				disabled: false,
				options: [
					{
						label: 'Both Name and Email',
						value: 'both',
					},
					{
						label: 'Name Only',
						value: 'name',
					},
					{
						label: 'Email Only',
						value: 'email',
					},
				],
			},
		}),
		caseSensitive: Property.Checkbox({
			displayName: 'Case Sensitive',
			description: 'Whether the search should be case sensitive',
			required: false,
			defaultValue: false,
		}),
	},
	async run(context) {
		const { teamId, searchTerm, searchType, searchFields, caseSensitive } = context.propsValue;

		const client = Client.initWithMiddleware({
			authProvider: {
				getAccessToken: () => Promise.resolve(context.auth.access_token),
			},
		});

		// Fetch all team members with expanded user information
		// https://learn.microsoft.com/en-us/graph/api/team-list-members?view=graph-rest-1.0&tabs=http
		const members: ConversationMemberWithUser[] = [];
		let response: PageCollection = await client.api(`/teams/${teamId}/members`).expand('user').get();
		
		// Handle pagination
		while (response.value.length > 0) {
			members.push(...(response.value as ConversationMemberWithUser[]));
			if (response['@odata.nextLink']) {
				response = await client.api(response['@odata.nextLink']).expand('user').get();
			} else {
				break;
			}
		}

		// Filter members based on search criteria
		const filteredMembers = members.filter((member: ConversationMemberWithUser) => {
			const displayName = caseSensitive ? member.displayName : member.displayName?.toLowerCase();
			// Access email through the user property
			const email = caseSensitive ? 
				member.user?.mail || member.user?.userPrincipalName : 
				(member.user?.mail || member.user?.userPrincipalName)?.toLowerCase();
			const search = caseSensitive ? searchTerm : searchTerm.toLowerCase();

			let nameMatch = false;
			let emailMatch = false;

			// Check name match
			if (searchFields === 'both' || searchFields === 'name') {
				switch (searchType) {
					case 'contains':
						nameMatch = displayName?.includes(search) || false;
						break;
					case 'startsWith':
						nameMatch = displayName?.startsWith(search) || false;
						break;
					case 'exact':
						nameMatch = displayName === search;
						break;
				}
			}

			// Check email match
			if (searchFields === 'both' || searchFields === 'email') {
				switch (searchType) {
					case 'contains':
						emailMatch = email?.includes(search) || false;
						break;
					case 'startsWith':
						emailMatch = email?.startsWith(search) || false;
						break;
					case 'exact':
						emailMatch = email === search;
						break;
				}
			}

			// Return true if any of the enabled fields match
			if (searchFields === 'both') {
				return nameMatch || emailMatch;
			} else if (searchFields === 'name') {
				return nameMatch;
			} else if (searchFields === 'email') {
				return emailMatch;
			}

			return false;
		});

		return {
			members: filteredMembers,
			totalFound: filteredMembers.length,
			searchTerm: searchTerm,
			searchType: searchType,
			searchFields: searchFields,
		};
	},
});
