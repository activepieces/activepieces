import { createAction, Property } from '@activepieces/pieces-framework';

import { pineconeAuth } from '../../auth';
import { pineconeClient } from '../../common/client';
import { pineconeDeleteAssistantFileOutputSchema } from '../../output-schemas';

export const pineconeDeleteAssistantFileAction = createAction({
	auth: pineconeAuth,
	name: 'pinecone_delete_assistant_file',
	outputSchema: pineconeDeleteAssistantFileOutputSchema,
	displayName: 'Delete Assistant File',
	description: 'Removes a file from an assistant.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Removes a file from an assistant so it is no longer used in answers, and returns the deletion operation. Cannot be undone.',
		idempotent: false,
	},
	props: {
		assistantName: Property.ShortText({
			displayName: 'Assistant Name',
			description: 'Name of the assistant, from List Assistants.',
			required: true,
		}),
		fileId: Property.ShortText({
			displayName: 'File ID',
			description: 'Assistant file ID, from List Assistant Files or Upload Assistant File.',
			required: true,
		}),
	},
	async run(context) {
		const p = context.propsValue;
		const client = pineconeClient.create({ auth: context.auth });
		const assistant = client.assistant({ name: p.assistantName });
		return await assistant.deleteFile(p.fileId);
	},
});
