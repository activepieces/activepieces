import { createAction, Property } from '@activepieces/pieces-framework';

import { pineconeAuth } from '../../auth';
import { pineconeClient } from '../../common/client';
import { pineconeGetAssistantFileOutputSchema } from '../../output-schemas';

export const pineconeGetAssistantFileAction = createAction({
	auth: pineconeAuth,
	name: 'pinecone_get_assistant_file',
	outputSchema: pineconeGetAssistantFileOutputSchema,
	displayName: 'Get Assistant File',
	description: 'Gets one file of an assistant and its processing status.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Gets one assistant file by ID: name, status (Processing, Available, Failed\u2026), percent done, metadata and, optionally, a temporary download URL.',
		idempotent: true,
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
		includeUrl: Property.Checkbox({
			displayName: 'Include Download URL',
			description: 'Also return a temporary signed URL to download the file.',
			required: false,
		}),
	},
	async run(context) {
		const p = context.propsValue;
		const client = pineconeClient.create({ auth: context.auth });
		const assistant = client.assistant({ name: p.assistantName });
		return await assistant.describeFile(p.fileId, p.includeUrl ?? false);
	},
});
