import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceUtils } from '../../../common/utils';
import { zohoInvoicePaymentRefundOutputSchema } from '../../../output-schemas';

export const updateCustomerPaymentRefundAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_update_customer_payment_refund',
	outputSchema: zohoInvoicePaymentRefundOutputSchema,
	displayName: 'Update Customer Payment Refund',
	description: 'Changes a refund recorded against a customer payment.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Changes the date, amount, mode, reference or description of a customer payment refund. Fields left empty keep their current value. Use List Customer Payments for the payment ID and List Customer Payment Refunds for the refund ID.',
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
		date: Property.ShortText({
			displayName: 'Date',
			description: 'New refund date, yyyy-mm-dd. Empty = unchanged.',
			required: false,
		}),
		amount: Property.Number({
			displayName: 'Amount',
			description: 'New refund amount. Empty = unchanged.',
			required: false,
		}),
		refundMode: Property.ShortText({
			displayName: 'Refund Mode',
			description: 'New refund mode, e.g. "cash" or "banktransfer". Empty = unchanged.',
			required: false,
		}),
		referenceNumber: Property.ShortText({
			displayName: 'Reference Number',
			description: 'New reference number. Empty = unchanged.',
			required: false,
		}),
		description: Property.ShortText({
			displayName: 'Description',
			description: 'New description. Empty = unchanged.',
			required: false,
		}),
	},
	async run({ auth, propsValue }) {
		const { organizationId, paymentId, refundId } = propsValue;
		const current = await zohoInvoiceApi.getCustomerPaymentRefund({
			auth,
			organizationId,
			paymentId,
			refundId,
		});
		return await zohoInvoiceApi.updateCustomerPaymentRefund({
			auth,
			organizationId,
			paymentId,
			refundId,
			body: zohoInvoiceUtils.compact({
				date: propsValue.date ?? current.payment_refunds?.date,
				amount: propsValue.amount ?? current.payment_refunds?.amount,
				refund_mode: propsValue.refundMode,
				reference_number: propsValue.referenceNumber,
				description: propsValue.description,
			}),
		});
	},
});
