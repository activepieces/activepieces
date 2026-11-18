import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceUtils } from '../../../common/utils';
import { zohoInvoiceTaxOutputSchema } from '../../../output-schemas';

export const updateTaxAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_update_tax',
	outputSchema: zohoInvoiceTaxOutputSchema,
	displayName: 'Update Tax',
	description: "Changes a tax's name, percentage or type.",
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			"Changes a tax's name, percentage or type. Fields left empty keep their current value. Use List Taxes to find the ID. Needs the Admin role.",
		idempotent: true,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		taxId: zohoInvoiceAiProps.taxId({ required: true }),
		taxName: Property.ShortText({
			displayName: 'Tax Name',
			description: 'New name. Empty = unchanged.',
			required: false,
		}),
		taxPercentage: Property.Number({
			displayName: 'Tax Percentage',
			description: 'New rate in percent. Empty = unchanged.',
			required: false,
		}),
		taxType: Property.StaticDropdown({
			displayName: 'Tax Type',
			description: 'New type: regular tax or compound tax. Empty = unchanged.',
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
		return await zohoInvoiceApi.updateTax({
			auth,
			organizationId: propsValue.organizationId,
			taxId: propsValue.taxId,
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
