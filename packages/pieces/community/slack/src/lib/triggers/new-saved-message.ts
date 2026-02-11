import { TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import { slackAuth } from '../../';
import { getTeamId, SlackAuthValue } from '../common/auth-helpers';

export const newSavedMessageTrigger = createTrigger({
	auth: slackAuth,
	name: 'new-saved-message',
	displayName: 'New Saved Message',
	description: 'Triggers when you save a message.',
	props: {},
	type: TriggerStrategy.APP_WEBHOOK,
	sampleData: undefined,
	onEnable: async (context) => {
		const teamId = await getTeamId(context.auth as SlackAuthValue);
		context.app.createListeners({
			events: ['star_added'],
			identifierValue: teamId,
		});
	},
	onDisable: async (context) => {
		// Ignored
	},

	run: async (context) => {
		const payloadBody = context.payload.body as PayloadBody;

		// check if it's saved message
		if (payloadBody.event.type === 'star_added' && payloadBody.event.item.type ==='message') {
			return [payloadBody.event.item];
		}

		return [];
	},
});

type PayloadBody = {
	event: {
		type: string;
		event_ts: string;
        item:{
            type:string
        }
	};
};
