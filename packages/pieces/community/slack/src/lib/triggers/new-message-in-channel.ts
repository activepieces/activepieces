import { Property, TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import { singleSelectChannelInfo, slackChannel } from '../common/props';
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

export const newMessageInChannelTrigger = createTrigger({
	auth: slackAuth,
	name: 'new-message-in-channel',
	displayName: 'New Message Posted to Channel',
	description: 'Triggers when a new message is posted to a specific #channel you choose.',
	props: {
		info: singleSelectChannelInfo,
		channel: slackChannel(true),
		ignoreBots: Property.Checkbox({
			displayName: 'Ignore Bot Messages ?',
			required: true,
			defaultValue: false,
		}),
	},
	type: TriggerStrategy.APP_WEBHOOK,
	sampleData: sampleData,
	async onEnable(context) {
		// Older OAuth2 has team_id, newer has team.id
		const teamId = context.auth.data['team_id'] ?? context.auth.data['team']['id'];
		context.app.createListeners({
			events: ['message'],
			identifierValue: teamId,
		});
	},
	async onDisable(context) {
		// Ignored
	},

	async test(context) {
		if (!context.propsValue.channel) {
			return [sampleData];
		}
		const client = new WebClient(context.auth.access_token);
		const response = await client.conversations.history({
			channel: context.propsValue.channel,
			limit: 100,
		});
		if (!response.messages) {
			return [];
		}
		const messages = response.messages
			.filter((message) => !isNil(message.ts))
			.filter((message) => !(context.propsValue.ignoreBots && message.bot_id))
			.map((message) => {
				return {
					...message,
					channel: context.propsValue.channel,
					event_ts: '1678231735.586539',
					channel_type: 'channel',
				};
			})
			.sort((a, b) => parseFloat(b.ts!) - parseFloat(a.ts!));
		return getFirstFiveOrAll(messages);
	},

	async run(context) {
		const payloadBody = context.payload.body as PayloadBody;
		if (payloadBody.event.channel === context.propsValue.channel) {
			// check for bot messages
			if (context.propsValue.ignoreBots && payloadBody.event.bot_id) {
				return [];
			}
			return [payloadBody.event];
		}

		return [];
	},
});

type PayloadBody = {
	event: {
		channel: string;
		bot_id?: string;
	};
};
