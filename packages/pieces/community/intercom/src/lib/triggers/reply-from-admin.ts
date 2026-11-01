import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { intercomAuth } from '../auth';
import { intercomClient } from '../common';
import { conversationEnvelopeTriggerOutputSchema } from '../output-schemas';
import { conversationEnvelopeSample, recentConversationEnvelopes } from '../common/webhook-samples';

export const replyFromAdmin = createTrigger({
	name: 'replyFromAdmin',
	classification: 'READ',
	displayName: 'Reply from an Intercom admin',
	description: 'Triggers when a reply is received from an Intercom admin (not a user or lead)',
	aiMetadata: {
		description: 'Fires when an Intercom admin or teammate replies to a conversation. Does not fire for replies sent by a user or lead. Outputs the whole webhook notification (id, topic, created_at); the conversation, with the new parts, is under data.item.',
	},
	props: {},
	sampleData: conversationEnvelopeSample('conversation.admin.replied'),
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
			events: ['conversation.admin.replied'],
			identifierValue: response['app']['id_code'],
		});
	},
	async onDisable() {
		return;
	},
	async test(context) {
		return recentConversationEnvelopes({ auth: context.auth, topic: 'conversation.admin.replied' });
	},
	async run(context) {
		return [context.payload.body];
	},
});
