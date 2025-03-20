import { Property, TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import { slackAuth } from '../../';
import { WebClient } from '@slack/web-api';
import { isNil } from '@activepieces/shared';
import { getFirstFiveOrAll } from '../common/utils';

const sampleData = {
	client_msg_id: '2767cf34-0651-44e0-b9c8-1b167ce9b7a9',
	type: 'message',
	text: 'f',
	user: 'U037UG6FKPU',
	ts: '1678231735.586539',
	blocks: [
		{
			type: 'rich_text',
			block_id: '4CM',
			elements: [
				{
					type: 'rich_text_section',
					elements: [
						{
							type: 'text',
							text: 'f',
						},
					],
				},
			],
		},
	],
	team: 'T037MS4FGDC',
	channel: 'C037RTX2ZDM',
	event_ts: '1678231735.586539',
	channel_type: 'channel',
};

export const newMessageTrigger = createTrigger({
	auth: slackAuth,
	name: 'new-message',
	displayName: 'New Public Message Posted Anywhere',
	description: 'Triggers when a new message is posted to any channel.',
	props: {
		ignoreBots: Property.Checkbox({
			displayName: 'Ignore Bot Messages ?',
			required: true,
			defaultValue: false,
		}),
	},
	type: TriggerStrategy.APP_WEBHOOK,
	sampleData: sampleData,
	onEnable: async (context) => {
		// Older OAuth2 has team_id, newer has team.id
		const teamId = context.auth.data['team_id'] ?? context.auth.data['team']['id'];
		context.app.createListeners({
			events: ['message'],
			identifierValue: teamId,
		});
	},
	onDisable: async (context) => {
		// Ignored
	},

	test: async (context) => {
		const client = new WebClient(context.auth.access_token);

		const channelList = await client.conversations.list({
			types: 'public_channel,private_channel',
			exclude_archived: true,
			limit: 1,
		});

		if (!channelList.channels || channelList.channels.length === 0) {
			return [sampleData];
		}

		const channel = channelList.channels[0].id ?? '';
		const response = await client.conversations.history({
			channel: channel,
			limit: 100,
		});

		if (!response.messages) {
			return [sampleData];
		}

		const messages = response.messages
			.filter((message) => !isNil(message.ts))
			.filter((message) => !(context.propsValue.ignoreBots && message.bot_id))
			.map((message) => {
				return {
					...message,
					event_ts: '1678231735.586539',
					channel_type: 'channel',
				};
			})
			.sort((a, b) => parseFloat(b.ts!) - parseFloat(a.ts!));
		return getFirstFiveOrAll(messages);
	},

	run: async (context) => {
		const payloadBody = context.payload.body as PayloadBody;

		// check for bot messages
		if (context.propsValue.ignoreBots && payloadBody.event.bot_id) {
			return [];
		}
		return [payloadBody.event];
	},
});

type PayloadBody = {
	event: {
		channel: string;
		bot_id?: string;
	};
};
