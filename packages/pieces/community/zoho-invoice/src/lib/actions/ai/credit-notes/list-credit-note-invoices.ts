import { createAction } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceListCreditNoteInvoicesOutputSchema } from '../../../output-schemas';

export const listCreditNoteInvoicesAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_list_credit_note_invoices',
	outputSchema: zohoInvoiceListCreditNoteInvoicesOutputSchema,
	displayName: 'List Credit Note Invoices',
	description: 'Lists the invoices a credit note was applied to.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			"Lists the invoices a credit note's credit was applied to, with the amount applied and the creditnote_invoice_id that Remove Credit Note From Invoice needs. Use List Credit Notes to find the ID.",
		idempotent: true,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		creditNoteId: zohoInvoiceAiProps.creditNoteId({ required: true }),
	},
	async run({ auth, propsValue }) {
		return await zohoInvoiceApi.listCreditNoteInvoices({
			auth,
			organizationId: propsValue.organizationId,
			creditNoteId: propsValue.creditNoteId,
		});
	},
});
