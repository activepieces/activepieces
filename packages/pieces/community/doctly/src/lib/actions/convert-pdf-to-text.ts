import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import FormData from 'form-data';
import { doctlyAuth } from '../auth';
import { doctlyClient } from '../common/client';
import { DoctlyCreateDocumentResponse, DoctlyDocument } from '../common/types';

export const convertPdfToTextAction = createAction({
	name: 'convert-pdf-to-text',
	classification: 'READ',
	auth: doctlyAuth,
	displayName: 'Convert PDF to Text',
	description: 'Converts PDF document to text file with markdown formatting.',
	audience: 'both',
	aiMetadata: {
		description:
			'Uploads a PDF file to Doctly AI and converts it to markdown-formatted text, returning the extracted text. The action submits the document, then blocks while polling Doctly until the conversion completes (up to a 5-minute timeout), so a single call can take a while. Requires a PDF file as input. Each call creates a new conversion job on Doctly, so it is not idempotent.',
		idempotent: false,
	},
	props: {
		file: Property.File({
			displayName: 'Document File',
			required: true,
		}),
	},
	async run(context) {
		const { file } = context.propsValue;

		const formData = new FormData();
		formData.append('file', file.data, { filename: file.filename });

		const created = await doctlyClient.request<DoctlyCreateDocumentResponse>({
			auth: context.auth,
			method: HttpMethod.POST,
			path: '/documents/',
			headers: {
				...formData.getHeaders(),
			},
			body: formData,
		});

		const docId = created.id;
		let status = created.status;
		const timeoutAt = Date.now() + 5 * 60 * 1000;

		while (!['COMPLETED', 'FAILED'].includes(status) && Date.now() < timeoutAt) {
			await new Promise((resolve) => setTimeout(resolve, 5000));

			const document = await doctlyClient.request<DoctlyDocument>({
				auth: context.auth,
				method: HttpMethod.GET,
				path: `/documents/${docId}`,
			});

			status = document.status;

			if (status === 'COMPLETED') {
				const markdownText = await doctlyClient.download<string>({ url: document.output_file_url });

				return { markdownText, ...document };
			}
			if (status === 'FAILED') throw new Error('Document processing failed.');
		}
		throw new Error('Document Parse timed out or failed.');
	},
});
