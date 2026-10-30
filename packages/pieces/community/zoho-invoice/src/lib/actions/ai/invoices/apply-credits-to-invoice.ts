import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceUtils } from '../../../common/utils';
import { zohoInvoiceApplyCreditsToInvoiceOutputSchema } from '../../../output-schemas';

export const applyCreditsToInvoiceAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_apply_credits_to_invoice',
	outputSchema: zohoInvoiceApplyCreditsToInvoiceOutputSchema,
	displayName: 'Apply Credits to Invoice',
	description: 'Applies customer credit notes or excess payments to an invoice.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Reduces the invoice balance with open credit notes and/or unused customer payments of the same customer. Use List Credit Notes for credit note IDs, List Customer Payments for payment IDs and List Invoices for the invoice ID. Not idempotent: each call applies the amounts again.',
		idempotent: false,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		invoiceId: zohoInvoiceAiProps.invoiceId({ required: true }),
		creditNotes: Property.Array({
			displayName: 'Credit Notes',
			description: 'Credit notes to apply and the amount from each.',
			required: false,
			properties: {
				creditNoteId: Property.ShortText({
					displayName: 'Credit Note ID',
					description: 'Credit note ID. Use List Credit Notes to find it.',
					required: true,
				}),
				amountApplied: Property.Number({
					displayName: 'Amount',
					description: 'Amount to apply from this credit note.',
					required: true,
				}),
			},
		}),
		payments: Property.Array({
			displayName: 'Payments',
			description: 'Unused customer payments to apply and the amount from each.',
			required: false,
			properties: {
				paymentId: Property.ShortText({
					displayName: 'Payment ID',
					description: 'Customer payment ID. Use List Customer Payments to find it.',
					required: true,
				}),
				amountApplied: Property.Number({
					displayName: 'Amount',
					description: 'Amount to apply from this payment.',
					required: true,
				}),
			},
		}),
	},
	async run({ auth, propsValue }) {
		const { creditNotes, payments } = propsValue;
		if ((creditNotes ?? []).length === 0 && (payments ?? []).length === 0) {
			throw new Error('Give at least one entry in Credit Notes or Payments.');
		}
		return await zohoInvoiceApi.applyCreditsToInvoice({
			auth,
			organizationId: propsValue.organizationId,
			invoiceId: propsValue.invoiceId,
			body: zohoInvoiceUtils.compact({
				apply_creditnotes:
					creditNotes &&
					zohoInvoiceUtils
						.toRecords({ rows: creditNotes, propName: 'Credit Notes' })
						.map((row) => ({
							creditnote_id: row['creditNoteId'],
							amount_applied: row['amountApplied'],
						})),
				invoice_payments:
					payments &&
					zohoInvoiceUtils
						.toRecords({ rows: payments, propName: 'Payments' })
						.map((row) => ({ payment_id: row['paymentId'], amount_applied: row['amountApplied'] })),
			}),
		});
	},
});
