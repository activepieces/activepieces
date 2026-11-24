import { createAction, Property } from '@activepieces/pieces-framework';

import { pineconeAuth } from '../../auth';
import { pineconeClient } from '../../common/client';
import { pineconeUtils } from '../../common/utils';
import { pineconeChatWithAssistantOutputSchema } from '../../output-schemas';

export const pineconeChatWithAssistantAction = createAction({
	auth: pineconeAuth,
	name: 'pinecone_chat_with_assistant',
	outputSchema: pineconeChatWithAssistantOutputSchema,
	displayName: 'Chat with Assistant',
	description: 'Asks an assistant a question and gets an answer with citations.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			"Sends the conversation to an assistant and returns its answer grounded in the assistant's files, with citations to the file pages used. Not streamed.",
		idempotent: false,
	},
	props: {
		assistantName: Property.ShortText({
			displayName: 'Assistant Name',
			description: 'Name of the assistant, from List Assistants.',
			required: true,
		}),
		messages: Property.Array({
			displayName: 'Messages',
			description:
				'Conversation so far, oldest first, e.g. [{"role": "user", "content": "What is our refund policy?"}]. Roles are "user" or "assistant".',
			required: true,
		}),
		model: Property.ShortText({
			displayName: 'Model',
			description:
				'Large language model to answer with, e.g. "gpt-4o", "claude-3-5-sonnet" or "gemini-2.5-pro". Defaults to gpt-4o.',
			required: false,
		}),
		temperature: Property.Number({
			displayName: 'Temperature',
			description: 'Randomness of the answer, 0-2. Lower is more deterministic.',
			required: false,
		}),
		filter: Property.Json({
			displayName: 'File Metadata Filter',
			description: 'Only use files whose metadata matches, e.g. {"department": "support"}.',
			required: false,
		}),
		jsonResponse: Property.Checkbox({
			displayName: 'JSON Answer',
			description: 'Ask for the answer as a JSON string.',
			required: false,
		}),
		includeHighlights: Property.Checkbox({
			displayName: 'Include Highlights',
			description: 'Include the cited text snippets in the citations.',
			required: false,
		}),
	},
	async run(context) {
		const p = context.propsValue;
		const client = pineconeClient.create({ auth: context.auth });
		const assistant = client.assistant({ name: p.assistantName });
		return await assistant.chat({
			messages: pineconeUtils.toMessages({ value: p.messages, propName: 'Messages' }),
			...(p.model !== undefined ? { model: p.model } : {}),
			...(p.temperature !== undefined ? { temperature: p.temperature } : {}),
			...(p.filter !== undefined ? { filter: p.filter } : {}),
			...(p.jsonResponse !== undefined ? { jsonResponse: p.jsonResponse } : {}),
			...(p.includeHighlights !== undefined ? { includeHighlights: p.includeHighlights } : {}),
		});
	},
});
