import { createAction } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceMessageOutputSchema } from '../../../output-schemas';

export const deleteCustomerPaymentAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_delete_customer_payment',
	outputSchema: zohoInvoiceMessageOutputSchema,
	displayName: 'Delete Customer Payment',
	description: 'Deletes a customer payment.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Permanently deletes a customer payment; the invoices it paid become unpaid again. Use List Customer Payments to find the ID. Cannot be undone.',
		idempotent: false,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		paymentId: zohoInvoiceAiProps.paymentId({ required: true }),
	},
	async run({ auth, propsValue }) {
		return await zohoInvoiceApi.deleteCustomerPayment({
			auth,
			organizationId: propsValue.organizationId,
			paymentId: propsValue.paymentId,
		});
	},
});
