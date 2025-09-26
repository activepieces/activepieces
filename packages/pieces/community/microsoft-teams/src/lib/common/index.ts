import { DropdownOption, PiecePropValueSchema, Property } from '@activepieces/pieces-framework';

import { Client, PageCollection } from '@microsoft/microsoft-graph-client';
import { Team, Channel, Chat, ConversationMember } from '@microsoft/microsoft-graph-types';
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

			// Pagination : https://learn.microsoft.com/en-us/graph/sdks/paging?view=graph-rest-1.0&tabs=typescript#manually-requesting-subsequent-pages
			// List Joined Channels : https://learn.microsoft.com/en-us/graph/api/user-list-joinedteams?view=graph-rest-1.0&tabs=http
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

			// Pagination : https://learn.microsoft.com/en-us/graph/sdks/paging?view=graph-rest-1.0&tabs=typescript#manually-requesting-subsequent-pages
			// List Channels : https://learn.microsoft.com/en-us/graph/api/channel-list?view=graph-rest-1.0&tabs=http
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
	memberId:(isRequired=false) =>Property.Dropdown({
		displayName: 'Member',
		refreshers: ['teamId'],
		required: isRequired,
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

			let response: PageCollection = await client.api(`/teams/${teamId}/members`).get();
			while (response.value.length > 0) {
				for (const member of response.value as ConversationMember[]) {
					options.push({ label: member.displayName!, value: member.id! });
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
	memberIds:(isRequired=false) =>Property.MultiSelectDropdown({
		displayName: 'Member',
		refreshers: ['teamId'],
		required: isRequired,
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

			let response: PageCollection = await client.api(`/teams/${teamId}/members`).get();
			while (response.value.length > 0) {
				for (const member of response.value as ConversationMember[]) {
					options.push({ label: member.displayName!, value: member.id! });
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
	chatId: Property.Dropdown({
		displayName: 'Chat ID',
		refreshers: [],
		required: true,
		options: async ({ auth }) => {
			if (!auth) {
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

			// Pagination : https://learn.microsoft.com/en-us/graph/sdks/paging?view=graph-rest-1.0&tabs=typescript#manually-requesting-subsequent-pages
			// List Chats : https://learn.microsoft.com/en-us/graph/api/chat-list?view=graph-rest-1.0&tabs=http
			let response: PageCollection = await client.api('/chats').expand('members').get();
			while (response.value.length > 0) {
				for (const chat of response.value as Chat[]) {
					const chatName =
						chat.topic ??
						chat.members
							?.filter((member: ConversationMember) => member.displayName)
							.map((member: ConversationMember) => member.displayName)
							.join(',');
					options.push({
						label: `(${CHAT_TYPE[chat.chatType!]} Chat) ${chatName || '(no title)'}`,
						value: chat.id!,
					});
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

const CHAT_TYPE = {
	oneOnOne: '1 : 1',
	group: 'Group',
	meeting: 'Meeting',
	unknownFutureValue: 'Unknown',
};
