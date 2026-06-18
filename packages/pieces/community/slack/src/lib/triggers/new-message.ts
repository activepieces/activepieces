import { Property, TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import { slackAuth } from '../auth';
import { getTeamId, SlackAuthValue } from '../common/auth-helpers';

export const newMessageTrigger = createTrigger({
	auth: slackAuth,
	name: 'new-message',
	displayName: 'New Public Message Posted Anywhere',
	description: 'Triggers when a new message is posted to any channel.',
	aiMetadata: {
		description:
			'Fires when a new message is posted in any public channel or group the app can access (direct messages are excluded). Bot messages can be optionally ignored. The event payload is the Slack message event, including its channel, text, and sender.',
	},
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
		const teamId = await getTeamId(context.auth as SlackAuthValue);
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
