import { createAction } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceGetCustomerPaymentOutputSchema } from '../../../output-schemas';

export const getCustomerPaymentAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_get_customer_payment',
	outputSchema: zohoInvoiceGetCustomerPaymentOutputSchema,
	displayName: 'Get Customer Payment',
	description: 'Gets one customer payment by ID.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Returns one customer payment by ID with amount, mode, date, customer and the invoices it was applied to. Use List Customer Payments to find the ID.',
		idempotent: true,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		paymentId: zohoInvoiceAiProps.paymentId({ required: true }),
	},
	async run({ auth, propsValue }) {
		return await zohoInvoiceApi.getCustomerPayment({
			auth,
			organizationId: propsValue.organizationId,
			paymentId: propsValue.paymentId,
		});
	},
});
