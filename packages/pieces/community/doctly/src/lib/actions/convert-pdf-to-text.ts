import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import FormData from 'form-data';
import { doctlyAuth } from '../auth';
import { doctlyClient } from '../common/client';
import { doctlyApi } from '../common/api';
import { DoctlyCreateDocumentResponse } from '../common/types';
import { convertPdfToTextOutputSchema } from '../output-schemas';

export const convertPdfToTextAction = createAction({
	name: 'convert-pdf-to-text',
	outputSchema: convertPdfToTextOutputSchema,
	classification: 'READ',
	auth: doctlyAuth,
	displayName: 'Convert PDF to Text',
	description: 'Converts PDF document to text file with markdown formatting.',
	audience: 'human',
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

			const document = await doctlyApi.getDocument({ auth: context.auth, documentId: docId });

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
