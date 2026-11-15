import { createAction, Property } from '@activepieces/pieces-framework';

import { pineconeAuth } from '../../auth';
import { pineconeClient } from '../../common/client';
import { pineconeUtils } from '../../common/utils';
import { pineconeDeleteAssistantFileOutputSchema } from '../../output-schemas';

export const pineconeUploadAssistantFileAction = createAction({
	auth: pineconeAuth,
	name: 'pinecone_upload_assistant_file',
	outputSchema: pineconeDeleteAssistantFileOutputSchema,
	displayName: 'Upload Assistant File',
	description: "Adds a file to an assistant's knowledge.",
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Uploads a file to an assistant and returns the processing operation. The file is usable once processing finishes: poll Get Assistant Operation or Get Assistant File.',
		idempotent: false,
	},
	props: {
		assistantName: Property.ShortText({
			displayName: 'Assistant Name',
			description: 'Name of the assistant, from List Assistants.',
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
		metadata: Property.Json({
			displayName: 'Metadata',
			description:
				'Key-value pairs (strings or numbers) to filter on later, e.g. {"department": "support"}.',
			required: false,
		}),
	},
	async run(context) {
		const p = context.propsValue;
		const client = pineconeClient.create({ auth: context.auth });
		const assistant = client.assistant({ name: p.assistantName });
		return await assistant.uploadFile({
			file: p.file.data,
			fileName: p.file.filename,
			...(p.multimodal !== undefined ? { multimodal: p.multimodal } : {}),
			...(p.metadata !== undefined
				? { metadata: pineconeUtils.toFileMetadata({ value: p.metadata, propName: 'Metadata' }) }
				: {}),
		});
	},
});
