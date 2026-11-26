import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { dumplingAuth } from '../auth';

export const extractDocument = createAction({
	name: 'extract_document',
	classification: 'READ',
	auth: dumplingAuth,
	displayName: 'Extract Document Data',
	description: 'Extract structured data from documents using vision-capable AI.',
	audience: 'both',
	aiMetadata: { description: 'Extracts data from an uploaded document (file or base64) using vision-capable AI on Dumpling AI, guided by a free-text extraction prompt, optionally returning the result as JSON. Use to pull fields or content out of PDFs, images, or scanned files. Not idempotent: each call is a fresh billed AI extraction whose output may vary.', idempotent: false },
	propertyGroups: [
		{ key: 'document', display: 'section', label: 'Document', icon: 'file', props: ['file'] },
		{ key: 'extraction', display: 'section', label: 'Extraction', icon: 'text', props: ['prompt', 'jsonMode'] },
	],
	props: {
		file: Property.File({
			displayName: 'File',
			required: true,
			description: 'The document to read, as an upload or a URL.',
		}),
		prompt: Property.LongText({
			displayName: 'Extraction Prompt',
			required: true,
			description: 'Describe the data you want pulled out of the document.',
			placeholder: 'List the invoice number, date and total amount.',
		}),
		jsonMode: Property.Checkbox({
			displayName: 'JSON Mode',
			required: false,
			defaultValue: false,
			description: 'Return the result as JSON instead of text.',
		}),
	},
	async run(context) {
		const { file, prompt, jsonMode } = context.propsValue;

		const requestBody: Record<string, unknown> = {
			inputMethod: 'base64',
			files: [file.base64],
			prompt,
		};

		if (jsonMode !== undefined) requestBody['jsonMode'] = jsonMode;

		const response = await httpClient.sendRequest({
			method: HttpMethod.POST,
			url: 'https://app.dumplingai.com/api/v1/extract-document',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${context.auth.secret_text}`,
			},
			body: requestBody,
		});

		return response.body;
	},
});
