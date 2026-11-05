import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { stripHtml } from 'string-strip-html';
import { intercomAuth } from '../auth';
import { intercomClient } from '../common';
import { conversationEnvelopeTriggerOutputSchema } from '../output-schemas';
import { conversationEnvelopeSample, recentConversationEnvelopes } from '../common/webhook-samples';

export const noteAddedToConversation = createTrigger({
	name: 'noteAddedToConversation',
	classification: 'READ',
	displayName: 'Note added to conversation',
	description: 'Triggers when a note is added to a conversation',
	aiMetadata: {
		description: 'Fires when an internal note is added to a conversation in Intercom. Notes are private remarks visible only to admins and teammates, not to the contact. An optional keyword keeps only notes that contain that exact word (whole word, case-sensitive). Outputs the whole webhook notification (id, topic, created_at); the conversation, with the new parts, is under data.item.',
	},
	props: {
		keyword: Property.ShortText({
			displayName: 'Keyword (optional)',
			description: 'Only notes containing this exact word fire the flow. Matching is whole-word and case-sensitive.',
			required: false,
		}),
	},
	sampleData: conversationEnvelopeSample('conversation.admin.noted'),
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
			events: ['conversation.admin.noted'],
			identifierValue: response['app']['id_code'],
		});
	},
	async onDisable() {
		return;
	},
	async test(context) {
		return recentConversationEnvelopes({ auth: context.auth, topic: 'conversation.admin.noted' });
	},
	async run(context) {
		const keyword = context.propsValue.keyword;
		const payloadBody = context.payload.body as IntercomPayloadBodyType;
		if (
			!keyword ||
			payloadBody?.data?.item?.conversation_parts.conversation_parts.some((part) =>
				stripHtml(part.body)
					.result.split(/\s/)
					.some((word) => word === keyword),
			)
		) {
			return [payloadBody];
		}
		return [];
	},
});

type IntercomPayloadBodyType = {
	data: {
		item: {
			conversation_parts: {
				conversation_parts: {
					body: string;
				}[];
			};
		};
	};
};
