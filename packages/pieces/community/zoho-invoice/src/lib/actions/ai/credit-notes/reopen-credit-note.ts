import { createAction } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceMessageOutputSchema } from '../../../output-schemas';

export const reopenCreditNoteAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_reopen_credit_note',
	outputSchema: zohoInvoiceMessageOutputSchema,
	displayName: 'Reopen Credit Note',
	description: 'Converts a voided credit note back to open.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Turns a voided credit note back to Open so its credit can be applied or refunded again. Use List Credit Notes to find the ID. Only works on void credit notes.',
		idempotent: true,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		creditNoteId: zohoInvoiceAiProps.creditNoteId({ required: true }),
	},
	async run({ auth, propsValue }) {
		return await zohoInvoiceApi.reopenCreditNote({
			auth,
			organizationId: propsValue.organizationId,
			creditNoteId: propsValue.creditNoteId,
		});
	},
});
