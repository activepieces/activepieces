import { createAction } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceMessageOutputSchema } from '../../../output-schemas';

export const deleteCreditNoteCommentAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_delete_credit_note_comment',
	outputSchema: zohoInvoiceMessageOutputSchema,
	displayName: 'Delete Credit Note Comment',
	description: 'Deletes a comment from a credit note.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Deletes one comment from a credit note. Use List Credit Notes for the credit note ID and List Credit Note Comments for the comment ID. Cannot be undone.',
		idempotent: false,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		creditNoteId: zohoInvoiceAiProps.creditNoteId({ required: true }),
		commentId: zohoInvoiceAiProps.commentId({
			required: true,
			description: 'Comment ID. Use List Credit Note Comments to find it.',
		}),
	},
	async run({ auth, propsValue }) {
		return await zohoInvoiceApi.deleteCreditNoteComment({
			auth,
			organizationId: propsValue.organizationId,
			creditNoteId: propsValue.creditNoteId,
			commentId: propsValue.commentId,
		});
	},
});
