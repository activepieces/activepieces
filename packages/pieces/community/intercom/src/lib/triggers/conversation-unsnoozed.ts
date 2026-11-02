import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { intercomAuth } from '../auth';
import { intercomClient } from '../common';
import { conversationEnvelopeTriggerOutputSchema } from '../output-schemas';
import { conversationEnvelopeSample, recentConversationEnvelopes } from '../common/webhook-samples';

export const conversationUnsnoozed = createTrigger({
	name: 'conversationUnsnoozed',
	classification: 'READ',
	displayName: 'Conversation unsnoozed',
	description: 'Triggers when a conversation is unsnoozed',
	aiMetadata: {
		description: 'Fires when a previously snoozed conversation is unsnoozed in Intercom, either because its snooze period elapsed or an admin reopened it manually, returning it to an active state. Outputs the whole webhook notification (id, topic, created_at); the conversation, with the new parts, is under data.item.',
	},
	props: {},
	sampleData: conversationEnvelopeSample('conversation.admin.unsnoozed'),
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
			events: ['conversation.admin.unsnoozed'],
			identifierValue: response['app']['id_code'],
		});
	},
	async onDisable() {
		return;
	},
	async test(context) {
		return recentConversationEnvelopes({ auth: context.auth, topic: 'conversation.admin.unsnoozed' });
	},
	async run(context) {
		return [context.payload.body];
	},
});
