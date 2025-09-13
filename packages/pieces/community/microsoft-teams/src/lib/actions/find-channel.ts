import { microsoftTeamsAuth } from '../..';
import { createAction, Property } from '@activepieces/pieces-framework';
import { Client, PageCollection } from '@microsoft/microsoft-graph-client';
import { microsoftTeamsCommon } from '../common';
import { Channel } from '@microsoft/microsoft-graph-types';

export const findChannel = createAction({
	auth: microsoftTeamsAuth,
	name: 'microsoft_teams_find_channel',
	displayName: 'Find Channel',
	description: 'Search for channels in a Microsoft Teams team by name or description.',
	props: {
		teamId: microsoftTeamsCommon.teamId,
		searchTerm: Property.ShortText({
			displayName: 'Search Term',
			description: 'The term to search for in channel names and descriptions',
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
		caseSensitive: Property.Checkbox({
			displayName: 'Case Sensitive',
			description: 'Whether the search should be case sensitive',
			required: false,
			defaultValue: false,
		}),
	},
	async run(context) {
		const { teamId, searchTerm, searchType, caseSensitive } = context.propsValue;

		const client = Client.initWithMiddleware({
			authProvider: {
				getAccessToken: () => Promise.resolve(context.auth.access_token),
			},
		});

		// Fetch all channels from the team
		// https://learn.microsoft.com/en-us/graph/api/channel-list?view=graph-rest-1.0&tabs=http
		const channels: Channel[] = [];
		let response: PageCollection = await client.api(`/teams/${teamId}/channels`).get();
		
		// Handle pagination
		while (response.value.length > 0) {
			channels.push(...(response.value as Channel[]));
			if (response['@odata.nextLink']) {
				response = await client.api(response['@odata.nextLink']).get();
			} else {
				break;
			}
		}

		// Filter channels based on search criteria
		const filteredChannels = channels.filter((channel: Channel) => {
			const channelName = caseSensitive ? channel.displayName : channel.displayName?.toLowerCase();
			const channelDescription = caseSensitive ? channel.description : channel.description?.toLowerCase();
			const search = caseSensitive ? searchTerm : searchTerm.toLowerCase();

			switch (searchType) {
				case 'contains':
					return channelName?.includes(search) || channelDescription?.includes(search);
				case 'startsWith':
					return channelName?.startsWith(search) || channelDescription?.startsWith(search);
				case 'exact':
					return channelName === search || channelDescription === search;
				default:
					return channelName?.includes(search) || channelDescription?.includes(search);
			}
		});

		return {
			channels: filteredChannels,
			totalFound: filteredChannels.length,
			searchTerm: searchTerm,
			searchType: searchType,
		};
	},
});
