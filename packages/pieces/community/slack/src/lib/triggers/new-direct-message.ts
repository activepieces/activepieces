import { Property, TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import { slackAuth } from '../../';

const sampleData = {
	user: 'U06C9507WGH',
	type: 'message',
	ts: '1741787044.231539',
	client_msg_id: '6f6e5257-6c39-40d8-bf22-f2bc2b7d8de9',
	text: 'Test Message',
	team: 'T06BTHUEFFF',
	blocks: [
		{
			type: 'rich_text',
			block_id: 'oUF4b',
			elements: [
				{
					type: 'rich_text_section',
					elements: [
						{
							type: 'text',
							text: 'Test Message',
						},
					],
				},
			],
		},
	],
	channel: 'D06BFVAL8CF',
	event_ts: '1741787044.231539',
	channel_type: 'im',
};

export const newDirectMessageTrigger = createTrigger({
	auth: slackAuth,
	name: 'new-direct-message',
	displayName: 'New Direct Message',
	description: 'Triggers when a message was posted in a direct message channel.',
	props: {
		ignoreBots: Property.Checkbox({
			displayName: 'Ignore Bot Messages ?',
			required: true,
			defaultValue: false,
		}),
		ignoreSelfMessages: Property.Checkbox({
			displayName: 'Ignore Message from Yourself ?',
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

	async test(context) {
		return [sampleData];
	},

	async run(context) {
		const payloadBody = context.payload.body as PayloadBody;
		const userId = context.auth.data['authed_user']?.id;

		if (payloadBody.event.channel_type !== 'im') {
			return [];
		}

		// check for bot messages
		if (
			(context.propsValue.ignoreBots && payloadBody.event.bot_id) ||
			(context.propsValue.ignoreSelfMessages && payloadBody.event.user === userId)
		) {
			return [];
		}
		return [payloadBody.event];
	},
});

type PayloadBody = {
	event: {
		channel: string;
		bot_id?: string;
		user: string;
		channel_type: string;
	};
};
