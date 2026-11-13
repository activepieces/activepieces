import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceAddCreditNoteCommentOutputSchema } from '../../../output-schemas';

export const addCreditNoteCommentAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_add_credit_note_comment',
	outputSchema: zohoInvoiceAddCreditNoteCommentOutputSchema,
	displayName: 'Add Credit Note Comment',
	description: 'Adds a comment to a credit note.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			"Adds an internal comment to a credit note's history. Use List Credit Notes to find the ID. Not idempotent: repeating the call adds the comment again.",
		idempotent: false,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		creditNoteId: zohoInvoiceAiProps.creditNoteId({ required: true }),
		description: Property.LongText({
			displayName: 'Comment',
			description: 'Comment text.',
			required: true,
		}),
	},
	async run({ auth, propsValue }) {
		return await zohoInvoiceApi.addCreditNoteComment({
			auth,
			organizationId: propsValue.organizationId,
			creditNoteId: propsValue.creditNoteId,
			description: propsValue.description,
		});
	},
});
