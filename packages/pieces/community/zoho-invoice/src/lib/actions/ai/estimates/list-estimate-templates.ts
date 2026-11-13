import { createAction } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceTemplatesOutputSchema } from '../../../output-schemas';

export const listEstimateTemplatesAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_list_estimate_templates',
	outputSchema: zohoInvoiceTemplatesOutputSchema,
	displayName: 'List Estimate Templates',
	description: 'Lists the PDF templates available for estimates.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists the PDF templates available for estimates with their template_id, for Set Estimate Template and the Template ID of Create Estimate.',
		idempotent: true,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
	},
	async run({ auth, propsValue }) {
		return await zohoInvoiceApi.listEstimateTemplates({
			auth,
			organizationId: propsValue.organizationId,
		});
	},
});
