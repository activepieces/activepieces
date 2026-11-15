import { createAction } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceMessageOutputSchema } from '../../../output-schemas';

export const deleteInvoicePaymentAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_delete_invoice_payment',
	outputSchema: zohoInvoiceMessageOutputSchema,
	displayName: 'Delete Invoice Payment',
	description: 'Removes a payment applied to an invoice.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Removes a payment applied to an invoice so the amount is due again; the customer payment itself is not deleted. Use List Invoices for the invoice ID and List Invoice Payments for the invoice_payment_id. Cannot be undone.',
		idempotent: false,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		invoiceId: zohoInvoiceAiProps.invoiceId({ required: true }),
		invoicePaymentId: zohoInvoiceAiProps.idProp({
			required: true,
			displayName: 'Invoice Payment ID',
			description:
				'invoice_payment_id of the applied payment. Use List Invoice Payments to find it.',
		}),
	},
	async run({ auth, propsValue }) {
		return await zohoInvoiceApi.deleteInvoicePayment({
			auth,
			organizationId: propsValue.organizationId,
			invoiceId: propsValue.invoiceId,
			invoicePaymentId: propsValue.invoicePaymentId,
		});
	},
});
