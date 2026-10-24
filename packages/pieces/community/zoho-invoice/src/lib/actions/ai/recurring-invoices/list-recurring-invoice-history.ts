import { createAction } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceListRecurringInvoiceHistoryOutputSchema } from '../../../output-schemas';

export const listRecurringInvoiceHistoryAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_list_recurring_invoice_history',
	outputSchema: zohoInvoiceListRecurringInvoiceHistoryOutputSchema,
	displayName: 'List Recurring Invoice History',
	description: 'Lists the comments and history of a recurring invoice profile.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists the comments and activity history of one recurring invoice profile. Use List Recurring Invoices to find the ID.',
		idempotent: true,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		recurringInvoiceId: zohoInvoiceAiProps.recurringInvoiceId({ required: true }),
	},
	async run({ auth, propsValue }) {
		return await zohoInvoiceApi.listRecurringInvoiceHistory({
			auth,
			organizationId: propsValue.organizationId,
			recurringInvoiceId: propsValue.recurringInvoiceId,
		});
	},
});
