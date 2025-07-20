import { Property, TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import { slackAuth } from '../../';

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
	sampleData: undefined,
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

	run: async (context) => {
		const payloadBody = context.payload.body as PayloadBody;

		// check if it's channel message
		if (!['channel','group'].includes(payloadBody.event.channel_type)) {
			return [];
		}

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
		channel_type:string
	};
};
