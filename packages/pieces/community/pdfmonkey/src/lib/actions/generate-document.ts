import { createAction, Property } from '@activepieces/pieces-framework';
import { pdfmonkeyAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { templateIdDropdown } from '../common/props';

export const generateDocumentAction = createAction({
	auth: pdfmonkeyAuth,
	name: 'generateDocument',
	displayName: 'Generate Document',
	description: 'Generates a new document using a specified template.',
	audience: 'both',
	aiMetadata: { description: 'Generate a PDF document in PDFMonkey from a template, merging in a JSON payload of data; optionally set a custom filename, attach metadata, and choose draft vs pending status. Use to produce a PDF from structured data. Each call creates a new document, so it is not idempotent.', idempotent: false },
	props: {
		document_template_id: templateIdDropdown,
		payload: Property.Json({
			displayName: 'Payload',
			description: 'Data to use for the Document generation.',
			required: true,
		}),
		meta: Property.Json({
			displayName: 'Meta',
			description: 'Meta-Data to attach to the Document.',
			required: false,
		}),
		fileName: Property.ShortText({
			displayName: 'Custom File Name',
			required: false,
		}),
		status: Property.StaticDropdown({
			displayName: 'Document Status',
			required: false,
			defaultValue: 'draft',
			options: {
				options: [
					{
						label: 'Draft',
						value: 'draft',
					},
					{
						label: 'Pending',
						value: 'pending',
					},
				],
			},
		}),
	},
	async run({ auth, propsValue }) {
		const { document_template_id, payload, meta, status, fileName } = propsValue;

		const metapayload = { ...meta };

		if (fileName) metapayload['_filename'] = fileName;

		const body = {
			document: {
				document_template_id,
				status,
				payload,
				meta: metapayload,
			},
		};
		const response = await makeRequest(
			auth,
			HttpMethod.POST,
			'/documents',
			undefined,
			body,
		);
		return response;
	},
});
