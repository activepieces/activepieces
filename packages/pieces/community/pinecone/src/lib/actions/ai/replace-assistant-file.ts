import { createAction, Property } from '@activepieces/pieces-framework';

import { pineconeAuth } from '../../auth';
import { pineconeClient } from '../../common/client';
import { pineconeDeleteAssistantFileOutputSchema } from '../../output-schemas';

export const pineconeReplaceAssistantFileAction = createAction({
	auth: pineconeAuth,
	name: 'pinecone_replace_assistant_file',
	outputSchema: pineconeDeleteAssistantFileOutputSchema,
	displayName: 'Replace Assistant File',
	description: 'Replaces the content of an assistant file, keeping its ID.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Replaces an existing assistant file with new content under the same file ID (or creates it with that ID), and returns the processing operation. Poll Get Assistant Operation until it finishes.',
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
		file: Property.File({
			displayName: 'File',
			description: 'File to add: PDF, DOCX, TXT, Markdown or JSON.',
			required: true,
		}),
		multimodal: Property.Checkbox({
			displayName: 'Multimodal',
			description: 'Also extract images from a PDF so the assistant can use them.',
			required: false,
		}),
	},
	async run(context) {
		const p = context.propsValue;
		const client = pineconeClient.create({ auth: context.auth });
		const assistant = client.assistant({ name: p.assistantName });
		return await assistant.upsertFile({
			assistantFileId: p.fileId,
			file: p.file.data,
			fileName: p.file.filename,
			...(p.multimodal !== undefined ? { multimodal: p.multimodal } : {}),
		});
	},
});
