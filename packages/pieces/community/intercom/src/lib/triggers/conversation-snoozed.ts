import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { intercomAuth } from '../auth';
import { intercomClient } from '../common';
import { conversationEnvelopeTriggerOutputSchema } from '../output-schemas';
import { conversationEnvelopeSample, recentConversationEnvelopes } from '../common/webhook-samples';

export const conversationSnoozed = createTrigger({
	name: 'conversationSnoozed',
	classification: 'READ',
	displayName: 'Conversation snoozed',
	description: 'Triggers when a conversation is snoozed',
	aiMetadata: {
		description: 'Fires when a conversation is snoozed in Intercom, meaning an admin temporarily pauses it until a chosen time. Outputs the whole webhook notification (id, topic, created_at); the conversation, with the new parts, is under data.item.',
	},
	props: {},
	sampleData: conversationEnvelopeSample('conversation.admin.snoozed'),
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
			events: ['conversation.admin.snoozed'],
			identifierValue: response['app']['id_code'],
		});
	},
	async onDisable() {
		return;
	},
	async test(context) {
		return recentConversationEnvelopes({ auth: context.auth, topic: 'conversation.admin.snoozed' });
	},
	async run(context) {
		return [context.payload.body];
	},
});
