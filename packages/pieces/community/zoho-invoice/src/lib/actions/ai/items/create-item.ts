import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceUtils } from '../../../common/utils';
import { zohoInvoiceCreateItemOutputSchema } from '../../../output-schemas';

export const createItemAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_create_item',
	outputSchema: zohoInvoiceCreateItemOutputSchema,
	displayName: 'Create Item',
	description: 'Creates a product or service item.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Creates an item (product or service) that can be added to invoices and estimates. Not idempotent: each call creates a new item, so use List Items first to avoid duplicates.',
		idempotent: false,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		name: Property.ShortText({
			displayName: 'Name',
			description: 'Name of the item.',
			required: true,
		}),
		rate: Property.Number({
			displayName: 'Rate',
			description: 'Selling price per unit.',
			required: true,
		}),
		description: Property.LongText({
			displayName: 'Description',
			description: 'Description shown on transactions.',
			required: false,
		}),
		sku: Property.ShortText({
			displayName: 'SKU',
			description: 'Stock keeping unit, unique across items.',
			required: false,
		}),
		productType: Property.StaticDropdown({
			displayName: 'Product Type',
			description: 'Whether the item is goods or a service. Empty = the vendor default.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'Goods', value: 'goods' },
					{ label: 'Service', value: 'service' },
				],
			},
		}),
		taxId: zohoInvoiceAiProps.taxId({ required: false }),
		isTaxable: zohoInvoiceAiProps.yesNo({
			required: false,
			displayName: 'Taxable',
			description: 'Whether the item is taxable. Empty = the vendor default.',
		}),
		additionalFields: zohoInvoiceAiProps.additionalFields({ required: false }),
	},
	async run({ auth, propsValue }) {
		return await zohoInvoiceApi.createItem({
			auth,
			organizationId: propsValue.organizationId,
			body: {
				...(propsValue.additionalFields ?? {}),
				...zohoInvoiceUtils.compact({
					name: propsValue.name,
					rate: propsValue.rate,
					description: propsValue.description,
					sku: propsValue.sku,
					product_type: propsValue.productType,
					tax_id: propsValue.taxId,
					is_taxable: zohoInvoiceUtils.toOptionalBoolean({ value: propsValue.isTaxable }),
				}),
			},
		});
	},
});
