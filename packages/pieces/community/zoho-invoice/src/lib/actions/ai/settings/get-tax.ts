import { createAction } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceTaxOutputSchema } from '../../../output-schemas';

export const getTaxAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_get_tax',
	outputSchema: zohoInvoiceTaxOutputSchema,
	displayName: 'Get Tax',
	description: 'Gets one tax of a Zoho Invoice organization.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Returns one tax by ID: name, percentage and type. Use List Taxes to find the ID; use Get Tax Group for a tax group.',
		idempotent: true,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		taxId: zohoInvoiceAiProps.taxId({ required: true }),
	},
	async run({ auth, propsValue }) {
		return await zohoInvoiceApi.getTax({
			auth,
			organizationId: propsValue.organizationId,
			taxId: propsValue.taxId,
		});
	},
});
