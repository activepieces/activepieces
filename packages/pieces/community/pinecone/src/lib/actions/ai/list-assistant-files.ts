import { createAction, Property } from '@activepieces/pieces-framework';

import { pineconeAuth } from '../../auth';
import { pineconeClient } from '../../common/client';
import { pineconeListAssistantFilesOutputSchema } from '../../output-schemas';

export const pineconeListAssistantFilesAction = createAction({
	auth: pineconeAuth,
	name: 'pinecone_list_assistant_files',
	outputSchema: pineconeListAssistantFilesOutputSchema,
	displayName: 'List Assistant Files',
	description: 'Lists the files of an assistant.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists the files uploaded to an assistant with their IDs, status and metadata, optionally only files whose metadata matches a filter.',
		idempotent: true,
	},
	props: {
		assistantName: Property.ShortText({
			displayName: 'Assistant Name',
			description: 'Name of the assistant, from List Assistants.',
			required: true,
		}),
		filter: Property.Json({
			displayName: 'Metadata Filter',
			description: 'Only list files whose metadata matches, e.g. {"department": "support"}.',
			required: false,
		}),
	},
	async run(context) {
		const p = context.propsValue;
		const client = pineconeClient.create({ auth: context.auth });
		const assistant = client.assistant({ name: p.assistantName });
		return await assistant.listFiles(p.filter !== undefined ? { filter: p.filter } : undefined);
	},
});
