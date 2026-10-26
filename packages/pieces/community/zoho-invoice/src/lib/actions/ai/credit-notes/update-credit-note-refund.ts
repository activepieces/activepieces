import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceUtils } from '../../../common/utils';
import { zohoInvoiceCreditNoteRefundOutputSchema } from '../../../output-schemas';

export const updateCreditNoteRefundAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_update_credit_note_refund',
	outputSchema: zohoInvoiceCreditNoteRefundOutputSchema,
	displayName: 'Update Credit Note Refund',
	description: 'Changes a refund recorded against a credit note.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Changes the date, amount, mode, reference or description of a credit note refund. Fields left empty keep their current value. Use List Credit Notes for the credit note ID and List Credit Note Refunds for the refund ID.',
		idempotent: true,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		creditNoteId: zohoInvoiceAiProps.creditNoteId({ required: true }),
		refundId: zohoInvoiceAiProps.idProp({
			required: true,
			displayName: 'Refund ID',
			description: 'Credit note refund ID. Use List Credit Note Refunds to find it.',
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
		return await zohoInvoiceApi.updateCreditNoteRefund({
			auth,
			organizationId: propsValue.organizationId,
			creditNoteId: propsValue.creditNoteId,
			refundId: propsValue.refundId,
			body: zohoInvoiceUtils.compact({
				date: propsValue.date,
				amount: propsValue.amount,
				refund_mode: propsValue.refundMode,
				reference_number: propsValue.referenceNumber,
				description: propsValue.description,
			}),
		});
	},
});
