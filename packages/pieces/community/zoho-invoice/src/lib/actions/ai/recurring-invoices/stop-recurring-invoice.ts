import { createAction } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceMessageWithDataOutputSchema } from '../../../output-schemas';

export const stopRecurringInvoiceAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_stop_recurring_invoice',
	outputSchema: zohoInvoiceMessageWithDataOutputSchema,
	displayName: 'Stop Recurring Invoice',
	description: 'Stops a recurring invoice profile.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Stops an active recurring invoice profile so it no longer generates invoices; it can be restarted with Resume Recurring Invoice. Use List Recurring Invoices to find the ID.',
		idempotent: true,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		recurringInvoiceId: zohoInvoiceAiProps.recurringInvoiceId({ required: true }),
	},
	async run({ auth, propsValue }) {
		return await zohoInvoiceApi.stopRecurringInvoice({
			auth,
			organizationId: propsValue.organizationId,
			recurringInvoiceId: propsValue.recurringInvoiceId,
		});
	},
});
