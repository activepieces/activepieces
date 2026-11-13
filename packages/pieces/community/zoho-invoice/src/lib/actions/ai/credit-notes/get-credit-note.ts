import { createAction } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceGetCreditNoteOutputSchema } from '../../../output-schemas';

export const getCreditNoteAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_get_credit_note',
	outputSchema: zohoInvoiceGetCreditNoteOutputSchema,
	displayName: 'Get Credit Note',
	description: 'Gets one credit note by ID.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Returns one credit note by ID with its customer, line items (with line_item_id), totals, balance and status. Use List Credit Notes to find the ID.',
		idempotent: true,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		creditNoteId: zohoInvoiceAiProps.creditNoteId({ required: true }),
	},
	async run({ auth, propsValue }) {
		return await zohoInvoiceApi.getCreditNote({
			auth,
			organizationId: propsValue.organizationId,
			creditNoteId: propsValue.creditNoteId,
		});
	},
});
