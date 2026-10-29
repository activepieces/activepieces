import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceUtils } from '../../../common/utils';
import { zohoInvoiceCreditNoteRefundOutputSchema } from '../../../output-schemas';

export const refundCreditNoteAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_refund_credit_note',
	outputSchema: zohoInvoiceCreditNoteRefundOutputSchema,
	displayName: 'Refund Credit Note',
	description: "Records a refund from a credit note's balance.",
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			"Records a refund paid to the customer out of a credit note's open balance; it does not move money itself. Use List Credit Notes to find the ID. Not idempotent: each call records another refund.",
		idempotent: false,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		creditNoteId: zohoInvoiceAiProps.creditNoteId({ required: true }),
		date: Property.ShortText({
			displayName: 'Date',
			description: 'Refund date, yyyy-mm-dd.',
			required: true,
		}),
		amount: Property.Number({
			displayName: 'Amount',
			description: "Amount refunded, at most the credit note's balance.",
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
		return await zohoInvoiceApi.refundCreditNote({
			auth,
			organizationId: propsValue.organizationId,
			creditNoteId: propsValue.creditNoteId,
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
