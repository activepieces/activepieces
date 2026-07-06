import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { intercomAuth } from '../auth';
import { intercomClient } from '../common';

export const replyFromUser = createTrigger({
	// auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
	name: 'replyFromUser',
	displayName: 'Reply from a user or lead',
	description: 'Triggers when a reply is received from a user or lead (not an admin)',
	aiMetadata: {
		description: 'Fires when a user or lead replies to a conversation in Intercom. Does not fire for replies sent by an admin or teammate. Outputs the conversation object reflecting the contact reply.',
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
			events: ['conversation.user.replied'],
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
