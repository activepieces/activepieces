import { Property, TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import { singleSelectChannelInfo, slackChannel } from '../common/props';
import { slackAuth } from '../../';
import { WebClient } from '@slack/web-api';
import { isNil } from '@activepieces/shared';
import { getFirstFiveOrAll } from '../common/utils';



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
	sampleData: undefined,
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
