import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceMessageOutputSchema } from '../../../output-schemas';

export const emailMultipleEstimatesAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_email_multiple_estimates',
	outputSchema: zohoInvoiceMessageOutputSchema,
	displayName: 'Email Multiple Estimates',
	description: 'Emails several estimates to their customers in one call.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			"Sends real emails for several estimates at once, each to its customer's contacts with the default template. Use Email Estimate to choose recipients or text for one estimate. Use List Estimates to find the IDs. Not idempotent: each call sends the emails again.",
		idempotent: false,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		estimateIds: Property.Array({
			displayName: 'Estimate IDs',
			description: 'IDs of the estimates to email. Use List Estimates to find them.',
			required: true,
		}),
	},
	async run({ auth, propsValue }) {
		const estimateIds = propsValue.estimateIds;
		if (
			estimateIds.length === 0 ||
			!estimateIds.every((id): id is string => typeof id === 'string' && id !== '')
		) {
			throw new Error('Estimate IDs must be a non-empty list of estimate ID strings.');
		}
		return await zohoInvoiceApi.emailMultipleEstimates({
			auth,
			organizationId: propsValue.organizationId,
			estimateIds,
		});
	},
});
