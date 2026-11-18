import { createAction } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceEstimateOutputSchema } from '../../../output-schemas';

export const getEstimateAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_get_estimate',
	outputSchema: zohoInvoiceEstimateOutputSchema,
	displayName: 'Get Estimate',
	description: 'Gets one estimate.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Returns one estimate by ID: customer, status, dates, line items, addresses and totals. Use List Estimates to find the ID.',
		idempotent: true,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		estimateId: zohoInvoiceAiProps.estimateId({ required: true }),
	},
	async run({ auth, propsValue }) {
		return await zohoInvoiceApi.getEstimate({
			auth,
			organizationId: propsValue.organizationId,
			estimateId: propsValue.estimateId,
		});
	},
});
