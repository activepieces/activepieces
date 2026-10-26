import { createAction } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceMessageOutputSchema } from '../../../output-schemas';

export const voidCreditNoteAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_void_credit_note',
	outputSchema: zohoInvoiceMessageOutputSchema,
	displayName: 'Void Credit Note',
	description: 'Marks a credit note as void.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Voids a credit note so its credit can no longer be used, keeping it on record. Use List Credit Notes to find the ID. Reverse it with Reopen Credit Note.',
		idempotent: true,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		creditNoteId: zohoInvoiceAiProps.creditNoteId({ required: true }),
	},
	async run({ auth, propsValue }) {
		return await zohoInvoiceApi.voidCreditNote({
			auth,
			organizationId: propsValue.organizationId,
			creditNoteId: propsValue.creditNoteId,
		});
	},
});
