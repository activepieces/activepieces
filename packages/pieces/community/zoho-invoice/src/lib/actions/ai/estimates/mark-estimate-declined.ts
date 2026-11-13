import { createAction } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceMessageOutputSchema } from '../../../output-schemas';

export const markEstimateDeclinedAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_mark_estimate_declined',
	outputSchema: zohoInvoiceMessageOutputSchema,
	displayName: 'Mark Estimate as Declined',
	description: 'Marks a sent estimate as declined by the customer.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Records that the customer declined a sent estimate. Use List Estimates to find the ID.',
		idempotent: true,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		estimateId: zohoInvoiceAiProps.estimateId({ required: true }),
	},
	async run({ auth, propsValue }) {
		return await zohoInvoiceApi.markEstimateDeclined({
			auth,
			organizationId: propsValue.organizationId,
			estimateId: propsValue.estimateId,
		});
	},
});
