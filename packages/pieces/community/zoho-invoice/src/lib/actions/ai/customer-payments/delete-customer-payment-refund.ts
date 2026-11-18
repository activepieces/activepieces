import { createAction } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceMessageOutputSchema } from '../../../output-schemas';

export const deleteCustomerPaymentRefundAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_delete_customer_payment_refund',
	outputSchema: zohoInvoiceMessageOutputSchema,
	displayName: 'Delete Customer Payment Refund',
	description: 'Deletes a refund of a customer payment.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			"Deletes a customer payment refund, returning its amount to the payment's unused balance. Use List Customer Payments for the payment ID and List Customer Payment Refunds for the refund ID. Cannot be undone.",
		idempotent: false,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		paymentId: zohoInvoiceAiProps.paymentId({ required: true }),
		refundId: zohoInvoiceAiProps.idProp({
			required: true,
			displayName: 'Refund ID',
			description: 'Customer payment refund ID. Use List Customer Payment Refunds to find it.',
		}),
	},
	async run({ auth, propsValue }) {
		return await zohoInvoiceApi.deleteCustomerPaymentRefund({
			auth,
			organizationId: propsValue.organizationId,
			paymentId: propsValue.paymentId,
			refundId: propsValue.refundId,
		});
	},
});
