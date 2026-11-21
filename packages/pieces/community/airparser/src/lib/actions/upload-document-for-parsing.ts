import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { airparserAuth } from '../auth';
import {
	airparserClient,
	airparserOutputSchemas,
	buildUploadForm,
	docIdOf,
	parseJsonObjectInput,
	pathFor,
	requireId,
	UPLOAD_TIMEOUT_MS,
} from '../common';
import { inboxIdDropdown } from '../common/props';

export const uploadDocumentAction = createAction({
	auth: airparserAuth,
	name: 'upload_document',
	classification: 'WRITE',
	displayName: 'Upload Document',
	description: 'Send a file to an inbox for parsing; returns the document ID right away while parsing runs in the background.',
	audience: 'human',
	aiMetadata: { idempotent: false },
	outputSchema: airparserOutputSchemas.upload,
	props: {
		inboxId: inboxIdDropdown,
		file: Property.File({
			displayName: 'File',
			description: 'The document to parse: PDF, EML, HTML, TXT, DOCX, XLSX, CSV, image or ZIP, up to 20 MB.',
			required: true,
		}),
		fileName: Property.ShortText({
			displayName: 'File Name',
			description: 'Keep the extension (e.g. invoice.pdf). Defaults to the name of the file; a missing extension is copied from the file.',
			required: false,
		}),
		meta: Property.Object({
			displayName: 'Metadata',
			description: 'Optional key-value data (e.g. an order ID) that comes back with the parsed result.',
			required: false,
		}),
	},
	async run(context) {
		const { inboxId, file, meta, fileName } = context.propsValue;
		const response = await airparserClient.call({
			apiKey: context.auth.secret_text,
			method: HttpMethod.POST,
			path: `/inboxes${pathFor([requireId({ value: inboxId, label: 'Inbox' })])}/upload`,
			operation: 'upload',
			body: buildUploadForm({ file, fileName, meta: parseJsonObjectInput({ value: meta, label: 'Metadata' }) }),
			timeoutMs: UPLOAD_TIMEOUT_MS,
		});
		return { docId: docIdOf(response) };
	},
});
