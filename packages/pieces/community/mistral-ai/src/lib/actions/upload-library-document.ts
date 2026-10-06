import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import FormData from 'form-data';
import { mistralAuth } from '../common/auth';
import { mistralApi } from '../common/client';
import { libraryUtils, MistralDocument } from '../common/libraries';
import { documentOutputSchema } from '../output-schemas';

export const uploadLibraryDocument = createAction({
	auth: mistralAuth,
	name: 'upload_library_document',
	classification: 'WRITE',
	displayName: 'Upload Library Document',
	description: 'Add a document to a library (Beta).',
	audience: 'ai',
	aiMetadata: {
		description:
			'Uploads a file into a Mistral document library (Beta) and returns the new document’s UUID and processing status. Processing is asynchronous: poll Get Document Status until it is done before relying on it in an agent or reading Get Document Text Content. Not idempotent: each call adds another document.',
		idempotent: false,
	},
	outputSchema: documentOutputSchema,
	props: {
		library_id: libraryUtils.libraryIdProp(),
		file: Property.File({
			displayName: 'File',
			description: 'The document to add, e.g. a PDF, DOCX or text file.',
			required: true,
		}),
	},
	async run(context) {
		const { library_id, file } = context.propsValue;
		const form = new FormData();
		form.append('file', Buffer.from(file.data), file.filename);
		const document = await mistralApi.call<MistralDocument>({
			auth: context.auth,
			method: HttpMethod.POST,
			path: `/libraries/${encodeURIComponent(library_id)}/documents`,
			headers: form.getHeaders(),
			body: form,
			timeout: 300000,
		});
		return libraryUtils.formatDocument(document);
	},
});
