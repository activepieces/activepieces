import { createAction, Property } from '@activepieces/pieces-framework';
import { placidAuth } from '../auth';
import { PlacidClient } from '../common/client';

export const getPdf = createAction({
	auth: placidAuth,
	name: 'get_pdf',
	displayName: 'Get PDF',
	description: 'Retrieves the generated PDF by its ID.',
	audience: 'both',
	aiMetadata: { description: 'Look up a previously created Placid PDF by its ID to read its current status and download URL. Use this to poll a queued render to completion or fetch the result of an earlier Create PDF call. Requires the PDF ID. Idempotent read-only lookup.', idempotent: true },
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
