import { createAction } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceCreditNoteRefundsOutputSchema } from '../../../output-schemas';

export const listCreditNoteRefundsAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_list_credit_note_refunds',
	outputSchema: zohoInvoiceCreditNoteRefundsOutputSchema,
	displayName: 'List Credit Note Refunds',
	description: 'Lists the refunds of one credit note.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists the refunds made from one credit note with creditnote_refund_id, date, mode and amount, one page at a time. Use List Credit Notes to find the ID; use List All Credit Note Refunds to search across credit notes.',
		idempotent: true,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		creditNoteId: zohoInvoiceAiProps.creditNoteId({ required: true }),
		page: zohoInvoiceAiProps.page({ required: false }),
		perPage: zohoInvoiceAiProps.perPage({ required: false }),
	},
	async run({ auth, propsValue }) {
		return await zohoInvoiceApi.listCreditNoteRefunds({
			auth,
			organizationId: propsValue.organizationId,
			creditNoteId: propsValue.creditNoteId,
			page: propsValue.page,
			perPage: propsValue.perPage,
		});
	},
});
