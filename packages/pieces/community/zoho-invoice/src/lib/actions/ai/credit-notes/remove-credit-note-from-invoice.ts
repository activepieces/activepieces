import { createAction } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceMessageOutputSchema } from '../../../output-schemas';

export const removeCreditNoteFromInvoiceAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_remove_credit_note_from_invoice',
	outputSchema: zohoInvoiceMessageOutputSchema,
	displayName: 'Remove Credit Note From Invoice',
	description: 'Removes credit applied from a credit note to an invoice.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			"Undoes one credit application, returning the amount to the credit note's balance and reopening it on the invoice; the invoice itself is not deleted. Use List Credit Notes for the credit note ID and List Credit Note Invoices for the credited invoice ID.",
		idempotent: false,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		creditNoteId: zohoInvoiceAiProps.creditNoteId({ required: true }),
		creditNoteInvoiceId: zohoInvoiceAiProps.idProp({
			required: true,
			displayName: 'Credited Invoice ID',
			description:
				'ID of the credit application (creditnote_invoice_id), not the invoice ID. Use List Credit Note Invoices to find it.',
		}),
	},
	async run({ auth, propsValue }) {
		return await zohoInvoiceApi.removeCreditNoteFromInvoice({
			auth,
			organizationId: propsValue.organizationId,
			creditNoteId: propsValue.creditNoteId,
			creditNoteInvoiceId: propsValue.creditNoteInvoiceId,
		});
	},
});
