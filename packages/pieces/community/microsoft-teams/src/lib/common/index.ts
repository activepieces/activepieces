import { DropdownOption, PiecePropValueSchema, Property } from '@activepieces/pieces-framework';

import { Client, PageCollection } from '@microsoft/microsoft-graph-client';
import { Team, Channel } from '@microsoft/microsoft-graph-types';
import { microsoftTeamsAuth } from '../../';

export const microsoftTeamsCommon = {
	teamId: Property.Dropdown({
		displayName: 'Team ID',
		refreshers: [],
		required: true,
		options: async ({ auth }) => {
			if (!auth) {
				return {
					disabled: true,
					placeholder: 'Please connect your account first.',
					options: [],
				};
			}
			const authValue = auth as PiecePropValueSchema<typeof microsoftTeamsAuth>;

			const client = Client.initWithMiddleware({
				authProvider: {
					getAccessToken: () => Promise.resolve(authValue.access_token),
				},
			});
			const options: DropdownOption<string>[] = [];

			// https://learn.microsoft.com/en-us/graph/sdks/paging?view=graph-rest-1.0&tabs=typescript#manually-requesting-subsequent-pages
			let response: PageCollection = await client.api('/me/joinedTeams').get();
			while (response.value.length > 0) {
				for (const team of response.value as Team[]) {
					options.push({ label: team.displayName!, value: team.id! });
				}
				if (response['@odata.nextLink']) {
					response = await client.api(response['@odata.nextLink']).get();
				} else {
					break;
				}
			}
			return {
				disabled: false,
				options: options,
			};
		},
	}),
	channelId: Property.Dropdown({
		displayName: 'Channel ID',
		refreshers: ['teamId'],
		required: true,
		options: async ({ auth, teamId }) => {
			if (!auth || !teamId) {
				return {
					disabled: true,
					placeholder: 'Please connect your account first and select team.',
					options: [],
				};
			}
			const authValue = auth as PiecePropValueSchema<typeof microsoftTeamsAuth>;

			const client = Client.initWithMiddleware({
				authProvider: {
					getAccessToken: () => Promise.resolve(authValue.access_token),
				},
			});
			const options: DropdownOption<string>[] = [];

			// https://learn.microsoft.com/en-us/graph/sdks/paging?view=graph-rest-1.0&tabs=typescript#manually-requesting-subsequent-pages
			let response: PageCollection = await client.api(`/teams/${teamId}/channels`).get();
			while (response.value.length > 0) {
				for (const channel of response.value as Channel[]) {
					options.push({ label: channel.displayName!, value: channel.id! });
				}
				if (response['@odata.nextLink']) {
					response = await client.api(response['@odata.nextLink']).get();
				} else {
					break;
				}
			}
			return {
				disabled: false,
				options: options,
			};
		},
	}),
};
