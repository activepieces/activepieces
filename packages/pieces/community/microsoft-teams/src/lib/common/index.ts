import { DropdownOption, OAuth2PropertyValue, PiecePropValueSchema, Property } from '@activepieces/pieces-framework';

import { PageCollection } from '@microsoft/microsoft-graph-client';
import { Team, Channel, Chat, ConversationMember, CallTranscript, CallRecording } from '@microsoft/microsoft-graph-types';
import { microsoftTeamsAuth } from '../auth';
import { createGraphClient, paginateGraphList, resolveMeetingId } from './graph';

export const microsoftTeamsCommon = {
	teamId: Property.Dropdown({
		auth: microsoftTeamsAuth,
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
			const cloud = (auth as OAuth2PropertyValue).props?.['cloud'] as string | undefined;
			const client = createGraphClient(authValue.access_token, cloud);

			// List Joined Teams : https://learn.microsoft.com/en-us/graph/api/user-list-joinedteams?view=graph-rest-1.0&tabs=http
			// Note: this endpoint does not support OData $top — pageSize intentionally omitted.
			const { items, error } = await paginateGraphList<Team>({
				client,
				initialUrl: '/me/joinedTeams',
				maxItems: DROPDOWN_LIST_MAX,
			});

			if (error && items.length === 0) {
				return {
					disabled: true,
					placeholder: "Couldn't load teams — please retry.",
					options: [],
				};
			}

			return {
				disabled: false,
				options: items.map((team) => ({ label: team.displayName!, value: team.id! })),
			};
		},
	}),
	channelId: Property.Dropdown({
		auth: microsoftTeamsAuth,
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
			const cloud = (auth as OAuth2PropertyValue).props?.['cloud'] as string | undefined;
			const client = createGraphClient(authValue.access_token, cloud);

			// List Channels : https://learn.microsoft.com/en-us/graph/api/channel-list?view=graph-rest-1.0&tabs=http
			// Note: this endpoint does not support OData $top — pageSize intentionally omitted.
			const { items, error } = await paginateGraphList<Channel>({
				client,
				initialUrl: `/teams/${teamId}/channels`,
				maxItems: DROPDOWN_LIST_MAX,
			});

			if (error && items.length === 0) {
				return {
					disabled: true,
					placeholder: "Couldn't load channels — please retry.",
					options: [],
				};
			}

			return {
				disabled: false,
				options: items.map((channel) => ({ label: channel.displayName!, value: channel.id! })),
			};
		},
	}),
	memberId: (isRequired = false) => Property.Dropdown({
		auth: microsoftTeamsAuth,
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
			const cloud = (auth as OAuth2PropertyValue).props?.['cloud'] as string | undefined;
			const client = createGraphClient(authValue.access_token, cloud);

			// Default page size on /teams/{id}/members is 100; explicit top() is
			// intentionally omitted to stay compatible with this endpoint's OData support.
			const { items, error } = await paginateGraphList<ConversationMember>({
				client,
				initialUrl: `/teams/${teamId}/members`,
				maxItems: DROPDOWN_LIST_MAX,
			});

			if (error && items.length === 0) {
				return {
					disabled: true,
					placeholder: "Couldn't load members — please retry.",
					options: [],
				};
			}

			return {
				disabled: false,
				options: items.map((member) => ({ label: member.displayName!, value: member.id! })),
			};
		},
	}),
	memberIds: (isRequired = false) => Property.MultiSelectDropdown({
		auth: microsoftTeamsAuth,
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
			const cloud = (auth as OAuth2PropertyValue).props?.['cloud'] as string | undefined;
			const client = createGraphClient(authValue.access_token, cloud);

			// Default page size on /teams/{id}/members is 100; explicit top() is
			// intentionally omitted to stay compatible with this endpoint's OData support.
			const { items, error } = await paginateGraphList<ConversationMember>({
				client,
				initialUrl: `/teams/${teamId}/members`,
				maxItems: DROPDOWN_LIST_MAX,
			});

			if (error && items.length === 0) {
				return {
					disabled: true,
					placeholder: "Couldn't load members — please retry.",
					options: [],
				};
			}

			return {
				disabled: false,
				options: items.map((member) => ({ label: member.displayName!, value: member.id! })),
			};
		},
	}),
	// https://learn.microsoft.com/en-us/answers/questions/1858332/get-list-of-online-meetings-for-teams
	meetingIdentifierType: Property.StaticDropdown({
		displayName: 'Meeting Identifier Type',
		description: 'Choose how to identify the meeting.',
		required: true,
		defaultValue: 'meetingId',
		options: {
			disabled: false,
			options: [
				{ label: 'Meeting ID', value: 'meetingId' },
				{ label: 'Join Web URL', value: 'joinWebUrl' },
				{ label: 'Join Meeting ID', value: 'joinMeetingId' },
			],
		},
	}),
	meetingIdentifierValue: Property.ShortText({
		displayName: 'Meeting Identifier Value',
		required: true,
	}),
	transcriptId: Property.Dropdown({
		auth: microsoftTeamsAuth,
		displayName: 'Transcript',
		refreshers: ['meetingIdentifierType', 'meetingIdentifierValue'],
		required: false,
		options: async ({ auth, meetingIdentifierType, meetingIdentifierValue }) => {
			if (!auth || !meetingIdentifierType || !meetingIdentifierValue) {
				return {
					disabled: true,
					placeholder: 'Please connect your account first and select a meeting.',
					options: [],
				};
			}
			const authValue = auth as PiecePropValueSchema<typeof microsoftTeamsAuth>;
			const cloud = (auth as OAuth2PropertyValue).props?.['cloud'] as string | undefined;
			const client = createGraphClient(authValue.access_token, cloud);
			const options: DropdownOption<string>[] = [];

			const meetingId = await resolveMeetingId({
				client,
				identifierType: meetingIdentifierType as string,
				identifierValue: meetingIdentifierValue as string,
			});

			// https://learn.microsoft.com/en-us/graph/api/onlinemeeting-list-transcripts?view=graph-rest-1.0
			let response: PageCollection = await client.api(`/me/onlineMeetings/${meetingId}/transcripts`).get();
			while (response.value.length > 0) {
				for (const transcript of response.value as CallTranscript[]) {
					const label = transcript.createdDateTime
						? new Date(transcript.createdDateTime).toLocaleString()
						: transcript.id!;
					options.push({ label, value: transcript.id! });
				}
				if (response['@odata.nextLink']) {
					response = await client.api(response['@odata.nextLink']).get();
				} else {
					break;
				}
			}
			return { disabled: false, options };
		},
	}),
	recordingId: Property.Dropdown({
		auth: microsoftTeamsAuth,
		displayName: 'Recording',
		refreshers: ['meetingIdentifierType', 'meetingIdentifierValue'],
		required: false,
		options: async ({ auth, meetingIdentifierType, meetingIdentifierValue }) => {
			if (!auth || !meetingIdentifierType || !meetingIdentifierValue) {
				return {
					disabled: true,
					placeholder: 'Please connect your account first and select a meeting.',
					options: [],
				};
			}
			const authValue = auth as PiecePropValueSchema<typeof microsoftTeamsAuth>;
			const cloud = (auth as OAuth2PropertyValue).props?.['cloud'] as string | undefined;
			const client = createGraphClient(authValue.access_token, cloud);
			const options: DropdownOption<string>[] = [];

			const meetingId = await resolveMeetingId({
				client,
				identifierType: meetingIdentifierType as string,
				identifierValue: meetingIdentifierValue as string,
			});

			// https://learn.microsoft.com/en-us/graph/api/onlinemeeting-list-recordings?view=graph-rest-1.0
			let response: PageCollection = await client.api(`/me/onlineMeetings/${meetingId}/recordings`).get();
			while (response.value.length > 0) {
				for (const recording of response.value as CallRecording[]) {
					const label = recording.createdDateTime
						? new Date(recording.createdDateTime).toLocaleString()
						: recording.id!;
					options.push({ label, value: recording.id! });
				}
				if (response['@odata.nextLink']) {
					response = await client.api(response['@odata.nextLink']).get();
				} else {
					break;
				}
			}
			return { disabled: false, options };
		},
	}),
	chatId: Property.Dropdown({
		auth: microsoftTeamsAuth,
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
			const cloud = (auth as OAuth2PropertyValue).props?.['cloud'] as string | undefined;
			const client = createGraphClient(authValue.access_token, cloud);

			// List Chats : https://learn.microsoft.com/en-us/graph/api/chat-list?view=graph-rest-1.0&tabs=http
			// Cap protects the 60s sandbox timeout and Graph throttling on /chats?$expand=members.
			const { items, error } = await paginateGraphList<Chat>({
				client,
				initialUrl: '/chats',
				expand: 'members',
				pageSize: CHATS_PAGE_SIZE,
				maxItems: DROPDOWN_LIST_MAX,
			});

			if (error && items.length === 0) {
				return {
					disabled: true,
					placeholder: "Couldn't load chats — please retry.",
					options: [],
				};
			}

			return {
				disabled: false,
				options: items.map((chat) => {
					const chatName =
						chat.topic ??
						chat.members
							?.filter((member: ConversationMember) => member.displayName)
							.map((member: ConversationMember) => member.displayName)
							.join(',');
					return {
						label: `(${CHAT_TYPE[chat.chatType! as keyof typeof CHAT_TYPE]} Chat) ${chatName || '(no title)'}`,
						value: chat.id!,
					};
				}),
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

const CHATS_PAGE_SIZE = 50;
const DROPDOWN_LIST_MAX = 500;
