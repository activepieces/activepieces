import { createAction } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceTemplatesOutputSchema } from '../../../output-schemas';

export const listCreditNoteTemplatesAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_list_credit_note_templates',
	outputSchema: zohoInvoiceTemplatesOutputSchema,
	displayName: 'List Credit Note Templates',
	description: 'Lists the PDF templates available for credit notes.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists the credit note PDF templates with template_id and name, for Set Credit Note Template or the template_id of Create Credit Note.',
		idempotent: true,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
	},
	async run({ auth, propsValue }) {
		return await zohoInvoiceApi.listCreditNoteTemplates({
			auth,
			organizationId: propsValue.organizationId,
		});
	},
});
