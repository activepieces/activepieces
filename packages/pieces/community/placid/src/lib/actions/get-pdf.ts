import { createAction, Property } from '@activepieces/pieces-framework';
import { placidAuth } from '../../index';
import { PlacidClient } from '../common/client';

export const getPdf = createAction({
	auth: placidAuth,
	name: 'get_pdf',
	displayName: 'Get PDF',
	description: 'Retrieves the generated PDF by its ID.',
	props: {
		pdfId: Property.ShortText({
			displayName: 'PDF ID',
			description: 'The ID of the PDF to retrieve',
			required: true,
		}),
	},
	async run(context) {
		const { pdfId } = context.propsValue;
		const client = new PlacidClient(context.auth);
		return await client.getPdf(pdfId);
	},
});
