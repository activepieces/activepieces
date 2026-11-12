import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceUtils } from '../../../common/utils';
import { zohoInvoiceTaxGroupOutputSchema } from '../../../output-schemas';

export const createTaxGroupAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_create_tax_group',
	outputSchema: zohoInvoiceTaxGroupOutputSchema,
	displayName: 'Create Tax Group',
	description: 'Combines several taxes into a tax group in Zoho Invoice.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Creates a tax group that applies several existing taxes together on a line item. Use List Taxes to find the tax IDs. Needs the Admin role. Not idempotent: each call creates a new group.',
		idempotent: false,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		taxGroupName: Property.ShortText({
			displayName: 'Tax Group Name',
			description: 'Name of the tax group.',
			required: true,
		}),
		taxes: Property.ShortText({
			displayName: 'Tax IDs',
			description: 'Comma-separated IDs of the taxes in the group. Use List Taxes to find them.',
			required: true,
		}),
		additionalFields: zohoInvoiceAiProps.additionalFields({ required: false }),
	},
	async run({ auth, propsValue }) {
		return await zohoInvoiceApi.createTaxGroup({
			auth,
			organizationId: propsValue.organizationId,
			body: {
				...(propsValue.additionalFields ?? {}),
				...zohoInvoiceUtils.compact({
					tax_group_name: propsValue.taxGroupName,
					taxes: propsValue.taxes,
				}),
			},
		});
	},
});
