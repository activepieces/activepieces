import { Property, TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import { singleSelectChannelInfo, slackChannel } from '../common/props';
import { slackAuth } from '../auth';
import { getTeamId, SlackAuthValue } from '../common/auth-helpers';



export const newMessageInChannelTrigger = createTrigger({
	auth: slackAuth,
	name: 'new-message-in-channel',
	displayName: 'New Message Posted to Channel',
	description: 'Triggers when a new message is posted to a specific #channel you choose.',
	aiMetadata: {
		description:
			'Fires when a new message is posted to the specific channel selected in the trigger configuration. Only channel or group messages in the chosen channel fire; bot messages can be optionally ignored. The event payload is the Slack message event, including its channel, text, and sender.',
	},
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
	sampleData: undefined,
	async onEnable(context) {
		const teamId = await getTeamId(context.auth as SlackAuthValue);
		context.app.createListeners({
			events: ['message'],
			identifierValue: teamId,
		});
	},
	async onDisable(context) {
		// Ignored
	},

	async run(context) {
		const payloadBody = context.payload.body as PayloadBody;

		// check if it's channel message
		if (!['channel','group'].includes(payloadBody.event.channel_type)) {
			return [];
		}
		
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
		channel_type:string
	};
};
