import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { intercomAuth } from '../auth';
import { intercomClient } from '../common';

export const conversationUnsnoozed = createTrigger({
	// auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
	name: 'conversationUnsnoozed',
	displayName: 'Conversation unsnoozed',
	description: 'Triggers when a conversation is unsnoozed',
	aiMetadata: {
		description: 'Fires when a previously snoozed conversation is unsnoozed in Intercom, either because its snooze period elapsed or an admin reopened it manually, returning it to an active state. Outputs the conversation object that was unsnoozed.',
	},
	props: {},
	sampleData: undefined,
	auth: intercomAuth,
	type: TriggerStrategy.APP_WEBHOOK,
	async onEnable(context) {
		const client = intercomClient(context.auth);
		const response = await client.admins.identify();

		if (!response.app?.id_code) {
			throw new Error('Could not find admin id code');
		}

		context.app.createListeners({
			events: ['conversation.admin.unsnoozed'],
			identifierValue: response['app']['id_code'],
		});
	},
	async onDisable(context) {
		// implement webhook deletion logic
	},
	async run(context) {
		return [context.payload.body];
	},
});
