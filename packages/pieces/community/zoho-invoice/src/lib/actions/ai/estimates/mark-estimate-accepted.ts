import { createAction } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceMessageOutputSchema } from '../../../output-schemas';

export const markEstimateAcceptedAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_mark_estimate_accepted',
	outputSchema: zohoInvoiceMessageOutputSchema,
	displayName: 'Mark Estimate as Accepted',
	description: 'Marks a sent estimate as accepted by the customer.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Records that the customer accepted a sent estimate. Use List Estimates to find the ID.',
		idempotent: true,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		estimateId: zohoInvoiceAiProps.estimateId({ required: true }),
	},
	async run({ auth, propsValue }) {
		return await zohoInvoiceApi.markEstimateAccepted({
			auth,
			organizationId: propsValue.organizationId,
			estimateId: propsValue.estimateId,
		});
	},
});
