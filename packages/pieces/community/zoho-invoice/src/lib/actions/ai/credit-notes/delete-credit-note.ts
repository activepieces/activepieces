import { createAction } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceMessageOutputSchema } from '../../../output-schemas';

export const deleteCreditNoteAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_delete_credit_note',
	outputSchema: zohoInvoiceMessageOutputSchema,
	displayName: 'Delete Credit Note',
	description: 'Deletes a credit note.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Permanently deletes a credit note. Use List Credit Notes to find the ID. Prefer Void Credit Note to keep a record. Cannot be undone.',
		idempotent: false,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		creditNoteId: zohoInvoiceAiProps.creditNoteId({ required: true }),
	},
	async run({ auth, propsValue }) {
		return await zohoInvoiceApi.deleteCreditNote({
			auth,
			organizationId: propsValue.organizationId,
			creditNoteId: propsValue.creditNoteId,
		});
	},
});
