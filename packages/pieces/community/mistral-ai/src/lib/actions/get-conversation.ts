import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { mistralAuth } from '../common/auth';
import { mistralApi } from '../common/client';
import { conversationUtils, MistralConversation } from '../common/conversations';
import { conversationOutputSchema } from '../output-schemas';

export const getConversation = createAction({
	auth: mistralAuth,
	name: 'get_conversation',
	classification: 'READ',
	displayName: 'Get Conversation',
	description: 'Get the details of a stored conversation (Beta).',
	audience: 'ai',
	aiMetadata: {
		description:
			'Returns one stored conversation’s metadata (Beta): name, agent or model, instructions and timestamps. It does not include the messages; use Get Conversation Messages or Get Conversation History for those. Read-only; safe to retry.',
		idempotent: true,
	},
	outputSchema: conversationOutputSchema,
	props: {
		conversation_id: conversationUtils.conversationIdProp(),
	},
	async run(context) {
		const conversation = await mistralApi.call<MistralConversation>({
			auth: context.auth,
			method: HttpMethod.GET,
			path: `/conversations/${encodeURIComponent(context.propsValue.conversation_id)}`,
		});
		return conversationUtils.formatConversation(conversation);
	},
});
