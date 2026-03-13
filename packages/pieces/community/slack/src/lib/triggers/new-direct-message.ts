import { Property, TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import { slackAuth } from '../auth';
import { getTeamId, getUserId, SlackAuthValue } from '../common/auth-helpers';



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
	sampleData: undefined,
	onEnable: async (context) => {
		// Older OAuth2 has team_id, newer has team.id
		const teamId = await getTeamId(context.auth as SlackAuthValue);
		context.app.createListeners({
			events: ['message'],
			identifierValue: teamId,
		});
	},
	onDisable: async (context) => {
		// Ignored
	},

	async run(context) {
		const payloadBody = context.payload.body as PayloadBody;
		const userId = await getUserId(context.auth as SlackAuthValue)

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
