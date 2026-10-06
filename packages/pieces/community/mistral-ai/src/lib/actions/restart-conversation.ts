import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { mistralAuth } from '../common/auth';
import { mistralApi } from '../common/client';
import { conversationUtils, ConversationResponse } from '../common/conversations';
import { conversationReplyOutputSchema } from '../output-schemas';

export const restartConversation = createAction({
	auth: mistralAuth,
	name: 'restart_conversation',
	classification: 'WRITE',
	displayName: 'Restart Conversation',
	description: 'Branch a conversation from an earlier entry with a new message (Beta).',
	audience: 'ai',
	aiMetadata: {
		description:
			'Creates a new conversation branch (Beta) that keeps the original history up to a chosen entry, then sends a new message from that point and returns the reply and the new conversation id; the original conversation is left unchanged. The entry id is required; get it from Get Conversation History. Use Append to Conversation to simply continue. Not idempotent: each call creates a new branch.',
		idempotent: false,
	},
	outputSchema: conversationReplyOutputSchema,
	props: {
		conversation_id: conversationUtils.conversationIdProp(),
		from_entry_id: Property.ShortText({
			displayName: 'From Entry ID',
			description: 'The entry to restart from, from Get Conversation History.',
			required: true,
		}),
		message: Property.LongText({
			displayName: 'Message',
			description: 'The new user message to send from that point.',
			required: true,
		}),
	},
	async run(context) {
		const { conversation_id, from_entry_id, message } = context.propsValue;
		const response = await mistralApi.call<ConversationResponse>({
			auth: context.auth,
			method: HttpMethod.POST,
			path: `/conversations/${encodeURIComponent(conversation_id)}/restart`,
			body: { inputs: message, from_entry_id, stream: false, store: true },
			timeout: 300000,
		});
		return conversationUtils.formatResponse(response);
	},
});
