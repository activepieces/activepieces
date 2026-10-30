import { createAction, Property } from '@activepieces/pieces-framework';

import { pineconeAuth } from '../../auth';
import { pineconeClient } from '../../common/client';
import { pineconeUtils } from '../../common/utils';
import { pineconeRetrieveAssistantContextOutputSchema } from '../../output-schemas';

export const pineconeRetrieveAssistantContextAction = createAction({
	auth: pineconeAuth,
	name: 'pinecone_retrieve_assistant_context',
	outputSchema: pineconeRetrieveAssistantContextOutputSchema,
	displayName: 'Retrieve Assistant Context',
	description: 'Gets the file snippets most relevant to a query, without generating an answer.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			"Returns the snippets from an assistant's files most relevant to a query (or to a conversation), with file references and scores, without asking a model to answer. Set exactly one of Query or Messages.",
		idempotent: true,
	},
	props: {
		assistantName: Property.ShortText({
			displayName: 'Assistant Name',
			description: 'Name of the assistant, from List Assistants.',
			required: true,
		}),
		query: Property.LongText({
			displayName: 'Query',
			description: 'Text to find relevant snippets for.',
			required: false,
		}),
		messages: Property.Array({
			displayName: 'Messages',
			description:
				'Conversation to find snippets for, e.g. [{"role": "user", "content": "…"}], instead of Query.',
			required: false,
		}),
		filter: Property.Json({
			displayName: 'File Metadata Filter',
			description: 'Only use files whose metadata matches, e.g. {"department": "support"}.',
			required: false,
		}),
		topK: Property.Number({
			displayName: 'Top K',
			description: 'Maximum number of snippets, 1-64. Defaults to 16.',
			required: false,
		}),
		snippetSize: Property.Number({
			displayName: 'Snippet Size',
			description: 'Maximum tokens per snippet. Defaults to 2048.',
			required: false,
		}),
	},
	async run(context) {
		const p = context.propsValue;
		const client = pineconeClient.create({ auth: context.auth });
		if ((p.query === undefined) === (p.messages === undefined)) {
			throw new Error('Set exactly one of "Query" or "Messages".');
		}
		const assistant = client.assistant({ name: p.assistantName });
		return await assistant.context({
			...(p.query !== undefined ? { query: p.query } : {}),
			...(p.messages !== undefined
				? { messages: pineconeUtils.toMessages({ value: p.messages, propName: 'Messages' }) }
				: {}),
			...(p.filter !== undefined ? { filter: p.filter } : {}),
			...(p.topK !== undefined ? { topK: p.topK } : {}),
			...(p.snippetSize !== undefined ? { snippetSize: p.snippetSize } : {}),
		});
	},
});
