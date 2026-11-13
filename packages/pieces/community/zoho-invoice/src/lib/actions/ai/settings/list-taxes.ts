import { createAction } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceListTaxesOutputSchema } from '../../../output-schemas';

export const listTaxesAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_list_taxes',
	outputSchema: zohoInvoiceListTaxesOutputSchema,
	displayName: 'List Taxes',
	description: 'Lists the taxes of a Zoho Invoice organization.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists the taxes and tax groups of the organization with tax_id, name, percentage and type, one page at a time. Use it to find the tax ID or tax group ID other actions need.',
		idempotent: true,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		page: zohoInvoiceAiProps.page({ required: false }),
		perPage: zohoInvoiceAiProps.perPage({ required: false }),
	},
	async run({ auth, propsValue }) {
		return await zohoInvoiceApi.listTaxes({
			auth,
			organizationId: propsValue.organizationId,
			page: propsValue.page,
			perPage: propsValue.perPage,
		});
	},
});
