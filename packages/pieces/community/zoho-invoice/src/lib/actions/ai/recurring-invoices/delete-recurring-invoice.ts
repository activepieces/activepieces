import { createAction } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceMessageOutputSchema } from '../../../output-schemas';

export const deleteRecurringInvoiceAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_delete_recurring_invoice',
	outputSchema: zohoInvoiceMessageOutputSchema,
	displayName: 'Delete Recurring Invoice',
	description: 'Deletes a recurring invoice profile.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Permanently deletes a recurring invoice profile so no more invoices are generated from it; invoices already created stay. Use Stop Recurring Invoice instead to pause it. Use List Recurring Invoices to find the ID. Cannot be undone.',
		idempotent: false,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		recurringInvoiceId: zohoInvoiceAiProps.recurringInvoiceId({ required: true }),
	},
	async run({ auth, propsValue }) {
		return await zohoInvoiceApi.deleteRecurringInvoice({
			auth,
			organizationId: propsValue.organizationId,
			recurringInvoiceId: propsValue.recurringInvoiceId,
		});
	},
});
