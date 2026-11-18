import { createAction } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceTaxGroupOutputSchema } from '../../../output-schemas';

export const getTaxGroupAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_get_tax_group',
	outputSchema: zohoInvoiceTaxGroupOutputSchema,
	displayName: 'Get Tax Group',
	description: 'Gets one tax group of a Zoho Invoice organization.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Returns one tax group by ID: name, combined percentage and the taxes it contains. Use List Taxes to find the ID; use Get Tax for a single tax.',
		idempotent: true,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		taxGroupId: zohoInvoiceAiProps.idProp({
			required: true,
			displayName: 'Tax Group ID',
			description: 'Tax group ID. Use List Taxes to find it.',
		}),
	},
	async run({ auth, propsValue }) {
		return await zohoInvoiceApi.getTaxGroup({
			auth,
			organizationId: propsValue.organizationId,
			taxGroupId: propsValue.taxGroupId,
		});
	},
});
