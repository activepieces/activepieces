import { createAction } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceMessageOutputSchema } from '../../../output-schemas';

export const deleteEstimateAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_delete_estimate',
	outputSchema: zohoInvoiceMessageOutputSchema,
	displayName: 'Delete Estimate',
	description: 'Deletes an estimate.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Permanently deletes an estimate. Use List Estimates to find the ID. Cannot be undone.',
		idempotent: false,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		estimateId: zohoInvoiceAiProps.estimateId({ required: true }),
	},
	async run({ auth, propsValue }) {
		return await zohoInvoiceApi.deleteEstimate({
			auth,
			organizationId: propsValue.organizationId,
			estimateId: propsValue.estimateId,
		});
	},
});
