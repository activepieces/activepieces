import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { intercomAuth } from '../../auth';
import { intercomRequest } from '../../common';
import { flattenParts, requireText } from '../../common/lookups';
import { conversationFlatPartsOutputSchema } from '../../output-schemas';

export const getConversationByIdAction = createAction({
	auth: intercomAuth,
	name: 'get_conversation_by_id',
	classification: 'READ',
	displayName: 'Get Conversation (by ID)',
	description: 'Gets a conversation and its messages by conversation ID.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Fetch one conversation by its ID, with every message flattened into parts (author type, author ID and name, part type, body, time). Use after Search Conversations or a trigger gives you the ID; use Search Conversations when you only know the customer or topic. Read-only and safe to retry.',
		idempotent: true,
	},
	props: {
		conversationId: Property.ShortText({
			displayName: 'Conversation ID',
			description: 'The Intercom conversation ID, for example from Search Conversations.',
			required: true,
		}),
		plainText: Property.Checkbox({
			displayName: 'Plain Text Bodies',
			description: 'Return message bodies as plain text instead of HTML.',
			required: false,
			defaultValue: true,
		}),
	},
	outputSchema: conversationFlatPartsOutputSchema,
	async run(context) {
		const conversationId = requireText({ label: 'Conversation ID', value: context.propsValue.conversationId });
		const conversation = await intercomRequest<Record<string, unknown>>({
			auth: context.auth,
			method: HttpMethod.GET,
			path: ['conversations', conversationId],
			query: { display_as: context.propsValue.plainText === false ? undefined : 'plaintext' },
			operation: 'get the conversation',
		});
		const { conversation_parts, ...rest } = conversation;
		return { ...rest, parts: flattenParts(conversation_parts) };
	},
});
