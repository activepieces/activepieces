import { createAction, Property } from '@activepieces/pieces-framework';
import { doctlyAuth } from '../common/auth';
import FormData from 'form-data';
import { AuthenticationType, httpClient, HttpMethod } from '@activepieces/pieces-common';
import { BASE_URL } from '../common/constants';
import { CreateDocumentResponse, GetDocumentResponse } from '../common/types';

export const convertPdfToTextAction = createAction({
	name: 'convert-pdf-to-text',
	auth: doctlyAuth,
	displayName: 'Convert PDF to Text',
	description: 'Converts PDF document to text file with markdown formatting.',
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

		const response = await httpClient.sendRequest<CreateDocumentResponse>({
			method: HttpMethod.POST,
			url: BASE_URL + '/documents/',
			authentication: {
				type: AuthenticationType.BEARER_TOKEN,
				token: context.auth.secret_text,
			},
			headers: {
				...formData.getHeaders(),
			},
			body: formData,
		});

		const docId = response.body.id;
		let status = response.body.status;
		const timeoutAt = Date.now() + 5 * 60 * 1000;

		while (!['COMPLETED', 'FAILED'].includes(status) && Date.now() < timeoutAt) {
			await new Promise((resolve) => setTimeout(resolve, 5000));

			const pollResponse = await httpClient.sendRequest<GetDocumentResponse>({
				method: HttpMethod.GET,
				url: BASE_URL + `/documents/${docId}`,
				authentication: {
					type: AuthenticationType.BEARER_TOKEN,
					token: context.auth.secret_text,
				},
			});

			status = pollResponse.body.status;

			if (status === 'COMPLETED') {
				const mdResponse = await httpClient.sendRequest({
					method: HttpMethod.GET,
					url: pollResponse.body.output_file_url,
				});

				const markdownText = mdResponse.body as unknown as string;

				return { markdownText, ...pollResponse.body };
			}
			if (status === 'FAILED') throw new Error('Document processing failed.');
		}
		throw new Error('Document Parse timed out or failed.');
	},
});
