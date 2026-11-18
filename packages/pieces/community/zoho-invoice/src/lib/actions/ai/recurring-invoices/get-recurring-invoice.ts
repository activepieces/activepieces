import { createAction } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceRecurringInvoiceOutputSchema } from '../../../output-schemas';

export const getRecurringInvoiceAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_get_recurring_invoice',
	outputSchema: zohoInvoiceRecurringInvoiceOutputSchema,
	displayName: 'Get Recurring Invoice',
	description: 'Gets one recurring invoice profile.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Returns one recurring invoice profile by ID: customer, frequency, start and end dates, status, line items and totals. Use List Recurring Invoices to find the ID.',
		idempotent: true,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		recurringInvoiceId: zohoInvoiceAiProps.recurringInvoiceId({ required: true }),
	},
	async run({ auth, propsValue }) {
		return await zohoInvoiceApi.getRecurringInvoice({
			auth,
			organizationId: propsValue.organizationId,
			recurringInvoiceId: propsValue.recurringInvoiceId,
		});
	},
});
