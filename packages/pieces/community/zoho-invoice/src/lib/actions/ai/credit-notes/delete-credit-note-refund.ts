import { createAction } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceMessageOutputSchema } from '../../../output-schemas';

export const deleteCreditNoteRefundAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_delete_credit_note_refund',
	outputSchema: zohoInvoiceMessageOutputSchema,
	displayName: 'Delete Credit Note Refund',
	description: 'Deletes a refund of a credit note.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			"Deletes a credit note refund, returning its amount to the credit note's balance. Use List Credit Notes for the credit note ID and List Credit Note Refunds for the refund ID. Cannot be undone.",
		idempotent: false,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		creditNoteId: zohoInvoiceAiProps.creditNoteId({ required: true }),
		refundId: zohoInvoiceAiProps.idProp({
			required: true,
			displayName: 'Refund ID',
			description: 'Credit note refund ID. Use List Credit Note Refunds to find it.',
		}),
	},
	async run({ auth, propsValue }) {
		return await zohoInvoiceApi.deleteCreditNoteRefund({
			auth,
			organizationId: propsValue.organizationId,
			creditNoteId: propsValue.creditNoteId,
			refundId: propsValue.refundId,
		});
	},
});
