import { createAction } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceMessageOutputSchema } from '../../../output-schemas';

export const markEstimateSentAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_mark_estimate_sent',
	outputSchema: zohoInvoiceMessageOutputSchema,
	displayName: 'Mark Estimate as Sent',
	description: 'Marks a draft estimate as sent.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Marks a draft estimate as sent without emailing it; use Email Estimate to actually send it. Use List Estimates to find the ID.',
		idempotent: true,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		estimateId: zohoInvoiceAiProps.estimateId({ required: true }),
	},
	async run({ auth, propsValue }) {
		return await zohoInvoiceApi.markEstimateSent({
			auth,
			organizationId: propsValue.organizationId,
			estimateId: propsValue.estimateId,
		});
	},
});
