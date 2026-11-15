import { createAction } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceListCreditNoteCommentsOutputSchema } from '../../../output-schemas';

export const listCreditNoteCommentsAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_list_credit_note_comments',
	outputSchema: zohoInvoiceListCreditNoteCommentsOutputSchema,
	displayName: 'List Credit Note Comments',
	description: 'Lists the comments and history of a credit note.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			"Lists a credit note's comments and activity history with comment_id, text, author and time. Use List Credit Notes to find the ID.",
		idempotent: true,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		creditNoteId: zohoInvoiceAiProps.creditNoteId({ required: true }),
	},
	async run({ auth, propsValue }) {
		return await zohoInvoiceApi.listCreditNoteComments({
			auth,
			organizationId: propsValue.organizationId,
			creditNoteId: propsValue.creditNoteId,
		});
	},
});
