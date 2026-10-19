import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { mistralAuth } from '../common/auth';
import { mistralApi } from '../common/client';
import { conversationUtils, ConversationResponse } from '../common/conversations';
import { conversationReplyOutputSchema } from '../output-schemas';

export const appendToConversation = createAction({
	auth: mistralAuth,
	name: 'append_to_conversation',
	classification: 'WRITE',
	displayName: 'Append to Conversation',
	description: 'Send a follow-up message in an existing conversation (Beta).',
	audience: 'ai',
	aiMetadata: {
		description:
			'Sends a follow-up user message to an existing stored conversation (Beta) and returns the new reply and output entries; Mistral keeps the earlier turns, so only send the new message. Needs a conversation id from Start Conversation or List Conversations. Use Restart Conversation to branch from an earlier entry instead. Not idempotent: each call adds a turn and bills a new reply.',
		idempotent: false,
	},
	outputSchema: conversationReplyOutputSchema,
	props: {
		conversation_id: conversationUtils.conversationIdProp(),
		message: Property.LongText({
			displayName: 'Message',
			description: 'The next user message.',
			required: true,
		}),
	},
	async run(context) {
		const { conversation_id, message } = context.propsValue;
		const response = await mistralApi.call<ConversationResponse>({
			auth: context.auth,
			method: HttpMethod.POST,
			path: `/conversations/${encodeURIComponent(conversation_id)}`,
			body: { inputs: message, stream: false, store: true },
			timeout: 300000,
		});
		return conversationUtils.formatResponse(response);
	},
});
