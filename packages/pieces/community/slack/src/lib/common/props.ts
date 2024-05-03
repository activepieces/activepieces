import { OAuth2PropertyValue, Property } from '@activepieces/pieces-framework';
import {
	AuthenticationType,
	httpClient,
	HttpMethod,
	HttpRequest,
} from '@activepieces/pieces-common';

export const slackInfo = Property.MarkDown({
	value: `
	Please make sure add the bot to the channel by following these steps:
	  1. Type /invite in the channel's chat.
	  2. Click on Add apps to this channel.
	  3. Search for and add the bot.`,
})
export const slackChannel = Property.Dropdown({
	displayName: 'Channel',
	description: 'Channel, private group, or IM channel to send message to.',
	required: true,
	refreshers: [],
	async options({ auth }) {
		if (!auth) {
			return {
				disabled: true,
				placeholder: 'connect slack account',
				options: [],
			};
		}
		const authentication = auth as OAuth2PropertyValue;
		const accessToken = authentication['access_token'];
		const channels: { label: string; value: string }[] = [];
		let cursor;
		do {
			const request: HttpRequest = {
				method: HttpMethod.GET,
				url: 'https://slack.com/api/conversations.list',
				queryParams: {
					types: 'public_channel,private_channel',
					limit: '200',
					cursor: cursor ?? '',
				},

				authentication: {
					type: AuthenticationType.BEARER_TOKEN,
					token: accessToken,
				},
			};
			const response = await httpClient.sendRequest<{
				channels: { id: string; name: string }[];
				response_metadata: { next_cursor: string };
			}>(request);
			channels.push(
				...response.body.channels.map((channel) => ({ label: channel.name, value: channel.id })),
			);
			cursor = response.body.response_metadata.next_cursor;
		} while (cursor !== '' && channels.length < 600);
		return {
			disabled: false,
			placeholder: 'Select channel',
			options: channels,
		};
	},
});

export const username = Property.ShortText({
	displayName: 'Username',
	description: 'The username of the bot',
	required: false,
});

export const profilePicture = Property.ShortText({
	displayName: 'Profile Picture',
	description: 'The profile picture of the bot',
	required: false,
});

export const blocks = Property.Json({
	displayName: 'Block Kit blocks',
	description: 'See https://api.slack.com/block-kit for specs',
	required: false,
});

export const userId = Property.Dropdown<string>({
	displayName: 'User',
	description: 'Message receiver',
	required: true,
	refreshers: [],
	async options({ auth }) {
		if (!auth) {
			return {
				disabled: true,
				placeholder: 'connect slack account',
				options: [],
			};
		}

		const accessToken = (auth as OAuth2PropertyValue).access_token;
		const users: { label: string; value: string }[] = [];

		let cursor;
		do {
			const request: HttpRequest = {
				method: HttpMethod.GET,
				url: 'https://slack.com/api/users.list',
				authentication: {
					type: AuthenticationType.BEARER_TOKEN,
					token: accessToken,
				},
				queryParams: {
					limit: '200',
					cursor: cursor ?? '',
				},
			};

			const response = await httpClient.sendRequest<UserListResponse>(request);
			users.push(
				...response.body.members.map((member) => ({ label: member.name, value: member.id })),
			);
			cursor = response.body.response_metadata.next_cursor;
		} while (cursor !== '' && users.length < 600);

		return {
			disabled: false,
			placeholder: 'Select channel',
			options: users,
		};
	},
});

export const text = Property.LongText({
	displayName: 'Message',
	description: 'The text of your message',
	required: true,
});

export const actions = Property.Array({
	displayName: 'Action Buttons',
	required: true,
});

type UserListResponse = {
	members: {
		id: string;
		name: string;
	}[];
	response_metadata: {
		next_cursor: string;
	};
};
