import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { intercomAuth } from '../auth';
import { intercomClient } from '../common';
import { conversationEnvelopeTriggerOutputSchema } from '../output-schemas';
import { conversationEnvelopeSample, recentConversationEnvelopes } from '../common/webhook-samples';

export const replyFromUser = createTrigger({
	name: 'replyFromUser',
	classification: 'READ',
	displayName: 'Reply from a user or lead',
	description: 'Triggers when a reply is received from a user or lead (not an admin)',
	aiMetadata: {
		description: 'Fires when a user or lead replies to a conversation in Intercom. Does not fire for replies sent by an admin or teammate. Outputs the whole webhook notification (id, topic, created_at); the conversation, with the new parts, is under data.item.',
	},
	props: {},
	sampleData: conversationEnvelopeSample('conversation.user.replied'),
	auth: intercomAuth,
	outputSchema: conversationEnvelopeTriggerOutputSchema,
	type: TriggerStrategy.APP_WEBHOOK,
	async onEnable(context) {
		const client = await intercomClient(context.auth);
		const response = await client.admins.identify();

		if (!response.app?.id_code) {
			throw new Error('Could not find admin id code');
		}
		context.app.createListeners({
			events: ['conversation.user.replied'],
			identifierValue: response['app']['id_code'],
		});
	},
	async onDisable() {
		return;
	},
	async test(context) {
		return recentConversationEnvelopes({ auth: context.auth, topic: 'conversation.user.replied' });
	},
	async run(context) {
		return [context.payload.body];
	},
});
