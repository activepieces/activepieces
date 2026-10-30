import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceUtils } from '../../../common/utils';
import { zohoInvoiceTaxOutputSchema } from '../../../output-schemas';

export const createTaxAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_create_tax',
	outputSchema: zohoInvoiceTaxOutputSchema,
	displayName: 'Create Tax',
	description: 'Creates a tax rate in a Zoho Invoice organization.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Creates a tax rate that can be applied to line items and grouped with Create Tax Group. Needs the Admin role. Not idempotent: each call creates a new tax.',
		idempotent: false,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		taxName: Property.ShortText({
			displayName: 'Tax Name',
			description: 'Name of the tax, e.g. "VAT".',
			required: true,
		}),
		taxPercentage: Property.Number({
			displayName: 'Tax Percentage',
			description: 'Rate in percent, e.g. 20 for 20%.',
			required: true,
		}),
		taxType: Property.StaticDropdown({
			displayName: 'Tax Type',
			description:
				'Regular tax or compound tax (applied on top of other taxes). Empty = the vendor default (tax).',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'Tax', value: 'tax' },
					{ label: 'Compound Tax', value: 'compound_tax' },
				],
			},
		}),
		additionalFields: zohoInvoiceAiProps.additionalFields({ required: false }),
	},
	async run({ auth, propsValue }) {
		return await zohoInvoiceApi.createTax({
			auth,
			organizationId: propsValue.organizationId,
			body: {
				...(propsValue.additionalFields ?? {}),
				...zohoInvoiceUtils.compact({
					tax_name: propsValue.taxName,
					tax_percentage: propsValue.taxPercentage,
					tax_type: propsValue.taxType,
				}),
			},
		});
	},
});
