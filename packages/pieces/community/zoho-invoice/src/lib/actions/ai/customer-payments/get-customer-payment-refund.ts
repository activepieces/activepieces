import { createAction } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoicePaymentRefundOutputSchema } from '../../../output-schemas';

export const getCustomerPaymentRefundAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_get_customer_payment_refund',
	outputSchema: zohoInvoicePaymentRefundOutputSchema,
	displayName: 'Get Customer Payment Refund',
	description: 'Gets one refund of a customer payment.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Returns one customer payment refund: date, refund mode, reference and amount. Use List Customer Payments for the payment ID and List Customer Payment Refunds for the refund ID.',
		idempotent: true,
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
		return await zohoInvoiceApi.getCustomerPaymentRefund({
			auth,
			organizationId: propsValue.organizationId,
			paymentId: propsValue.paymentId,
			refundId: propsValue.refundId,
		});
	},
});
