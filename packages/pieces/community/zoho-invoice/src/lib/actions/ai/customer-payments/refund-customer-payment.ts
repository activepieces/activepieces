import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceUtils } from '../../../common/utils';
import { zohoInvoicePaymentRefundOutputSchema } from '../../../output-schemas';

export const refundCustomerPaymentAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_refund_customer_payment',
	outputSchema: zohoInvoicePaymentRefundOutputSchema,
	displayName: 'Refund Customer Payment',
	description: 'Records a refund of the excess part of a customer payment.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Records a refund of the unapplied (excess) amount of a customer payment; it does not move money itself and fails when the payment has no excess. Use List Customer Payments to find the ID. Not idempotent: each call records another refund.',
		idempotent: false,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		paymentId: zohoInvoiceAiProps.paymentId({ required: true }),
		date: Property.ShortText({
			displayName: 'Date',
			description: 'Refund date, yyyy-mm-dd.',
			required: true,
		}),
		amount: Property.Number({
			displayName: 'Amount',
			description: "Amount refunded, at most the payment's unapplied amount.",
			required: true,
		}),
		refundMode: Property.ShortText({
			displayName: 'Refund Mode',
			description: 'How the refund was paid, e.g. "cash", "check" or "banktransfer".',
			required: false,
		}),
		referenceNumber: Property.ShortText({
			displayName: 'Reference Number',
			description: 'Your own reference for the refund.',
			required: false,
		}),
		description: Property.ShortText({
			displayName: 'Description',
			description: 'Note about the refund.',
			required: false,
		}),
		additionalFields: zohoInvoiceAiProps.additionalFields({ required: false }),
	},
	async run({ auth, propsValue }) {
		return await zohoInvoiceApi.refundCustomerPayment({
			auth,
			organizationId: propsValue.organizationId,
			paymentId: propsValue.paymentId,
			body: {
				...(propsValue.additionalFields ?? {}),
				...zohoInvoiceUtils.compact({
					date: propsValue.date,
					amount: propsValue.amount,
					refund_mode: propsValue.refundMode,
					reference_number: propsValue.referenceNumber,
					description: propsValue.description,
				}),
			},
		});
	},
});
