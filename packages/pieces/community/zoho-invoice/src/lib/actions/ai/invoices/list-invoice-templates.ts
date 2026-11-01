import { createAction } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceTemplatesOutputSchema } from '../../../output-schemas';

export const listInvoiceTemplatesAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_list_invoice_templates',
	outputSchema: zohoInvoiceTemplatesOutputSchema,
	displayName: 'List Invoice Templates',
	description: 'Lists the PDF templates available for invoices.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists the invoice PDF templates of the organization with template_id and name. The template_id is what Set Invoice Template needs.',
		idempotent: true,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
	},
	async run({ auth, propsValue }) {
		return await zohoInvoiceApi.listInvoiceTemplates({
			auth,
			organizationId: propsValue.organizationId,
		});
	},
});
