import { createAction } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceGetCreditNoteEmailHistoryOutputSchema } from '../../../output-schemas';

export const getCreditNoteEmailHistoryAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_get_credit_note_email_history',
	outputSchema: zohoInvoiceGetCreditNoteEmailHistoryOutputSchema,
	displayName: 'Get Credit Note Email History',
	description: 'Lists the emails sent for a credit note.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists every email sent for a credit note with recipients, subject and send time. Use List Credit Notes to find the ID.',
		idempotent: true,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		creditNoteId: zohoInvoiceAiProps.creditNoteId({ required: true }),
	},
	async run({ auth, propsValue }) {
		return await zohoInvoiceApi.getCreditNoteEmailHistory({
			auth,
			organizationId: propsValue.organizationId,
			creditNoteId: propsValue.creditNoteId,
		});
	},
});
