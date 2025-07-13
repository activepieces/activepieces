import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { placidAuth } from '../common/auth';
import { placidApiCall } from '../common/client';

export const getPdfAction = createAction({
	name: 'get-pdf',
	auth: placidAuth,
	displayName: 'Get PDF',
	description: 'Retrieve a previously generated PDF by its ID.',
	props: {
		pdfId: Property.ShortText({
			displayName: 'PDF ID',
			description: 'The ID of the PDF to retrieve (returned from the Create PDF API).',
			required: true,
		}),
	},
	async run({ propsValue, auth }) {
		const { pdfId } = propsValue;

		const response = await placidApiCall({
			apiKey: auth,
			method: HttpMethod.GET,
			resourceUri: `/pdfs/${pdfId}`,
		});

		return response;
	},
});
