import { createAction, Property } from '@activepieces/pieces-framework';
import { placidAuth } from '../../index';
import { HttpMethod, httpClient, AuthenticationType } from '@activepieces/pieces-common';
import { PLACID_BASE_URL } from '../common';
import FormData from 'form-data';

export const convertFileToUrl = createAction({
	auth: placidAuth,
	name: 'convert_file_to_url',
	displayName: 'Convert File to URL',
	description: 'Convert uploaded file(s) into media URL(s) consumable by Placid templates.',
	props: {
		file: Property.File({
			displayName: 'File',
			description: 'The file to convert to a URL.',
			required: true,
		}),
		filename: Property.ShortText({
			displayName: 'Filename',
			description: 'Optional custom filename for the uploaded file.',
			required: false,
		}),
	},
	async run(context) {
		const { file, filename } = context.propsValue;

		const formData = new FormData();

		// Convert base64 to buffer for form-data
		const buffer = Buffer.from(file.base64, 'base64');
		formData.append('file', buffer, {
			filename: filename || file.filename,
			contentType: file.extension ? `application/${file.extension}` : 'application/octet-stream',
		});

		try {
			const response = await httpClient.sendRequest({
				method: HttpMethod.POST,
				url: `${PLACID_BASE_URL}/media`,
				body: formData,
				authentication: {
					type: AuthenticationType.BEARER_TOKEN,
					token: context.auth,
				},
				headers: {
					...formData.getHeaders(),
				},
			});

			return response.body;
		} catch (error: any) {
			if (error.response?.status === 404) {
				throw new Error(
					'File upload not supported. This feature may not be available for demo accounts or may require a paid Placid plan. Please check your account permissions.',
				);
			}
			if (error.response?.status === 413) {
				throw new Error('File too large. Please check Placid file size limits.');
			}
			if (error.response?.status === 403) {
				throw new Error(
					'File upload access forbidden. This feature may require additional permissions in your Placid account.',
				);
			}
			throw error;
		}
	},
});
