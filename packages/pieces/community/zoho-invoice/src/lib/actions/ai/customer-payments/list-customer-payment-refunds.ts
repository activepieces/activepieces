import { createAction } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceListCustomerPaymentRefundsOutputSchema } from '../../../output-schemas';

export const listCustomerPaymentRefundsAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_list_customer_payment_refunds',
	outputSchema: zohoInvoiceListCustomerPaymentRefundsOutputSchema,
	displayName: 'List Customer Payment Refunds',
	description: 'Lists the refunds of a customer payment.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists the refunds of one customer payment with payment_refund_id, date, mode and amount, one page at a time. Use List Customer Payments to find the ID.',
		idempotent: true,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		paymentId: zohoInvoiceAiProps.paymentId({ required: true }),
		page: zohoInvoiceAiProps.page({ required: false }),
		perPage: zohoInvoiceAiProps.perPage({ required: false }),
	},
	async run({ auth, propsValue }) {
		return await zohoInvoiceApi.listCustomerPaymentRefunds({
			auth,
			organizationId: propsValue.organizationId,
			paymentId: propsValue.paymentId,
			page: propsValue.page,
			perPage: propsValue.perPage,
		});
	},
});
