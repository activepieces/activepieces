import { DropdownOption, OAuth2PropertyValue, PiecePropValueSchema, Property } from '@activepieces/pieces-framework';

import { PageCollection } from '@microsoft/microsoft-graph-client';
import { Team, Channel, Chat, ConversationMember, CallTranscript, CallRecording } from '@microsoft/microsoft-graph-types';
import { microsoftTeamsAuth } from '../auth';
import { createGraphClient, resolveMeetingId } from './graph';

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
						label: `(${CHAT_TYPE[chat.chatType! as keyof typeof CHAT_TYPE]} Chat) ${chatName || '(no title)'}`,
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
