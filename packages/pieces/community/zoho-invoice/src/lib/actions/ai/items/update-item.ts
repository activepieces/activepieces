import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceUtils } from '../../../common/utils';
import { zohoInvoiceItemOutputSchema } from '../../../output-schemas';

export const updateItemAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_update_item',
	outputSchema: zohoInvoiceItemOutputSchema,
	displayName: 'Update Item',
	description: 'Changes the details of an item.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			"Changes an item's name, rate, description, SKU, type or tax. Fields left empty keep their current value. Use List Items to find the ID.",
		idempotent: true,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		itemId: zohoInvoiceAiProps.itemId({ required: true }),
		name: Property.ShortText({
			displayName: 'Name',
			description: 'New name. Empty = unchanged.',
			required: false,
		}),
		rate: Property.Number({
			displayName: 'Rate',
			description: 'New selling price per unit. Empty = unchanged.',
			required: false,
		}),
		description: Property.LongText({
			displayName: 'Description',
			description: 'New description. Empty = unchanged.',
			required: false,
		}),
		sku: Property.ShortText({
			displayName: 'SKU',
			description: 'New stock keeping unit. Empty = unchanged.',
			required: false,
		}),
		productType: Property.StaticDropdown({
			displayName: 'Product Type',
			description: 'Goods or service. Empty = unchanged.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'Goods', value: 'goods' },
					{ label: 'Service', value: 'service' },
				],
			},
		}),
		taxId: zohoInvoiceAiProps.taxId({
			required: false,
			description: 'New tax ID. Use List Taxes to find it. Empty = unchanged.',
		}),
		isTaxable: zohoInvoiceAiProps.yesNo({
			required: false,
			displayName: 'Taxable',
			description: 'Whether the item is taxable. Empty = unchanged.',
		}),
		additionalFields: zohoInvoiceAiProps.additionalFields({ required: false }),
	},
	async run({ auth, propsValue }) {
		const { organizationId, itemId } = propsValue;
		const current = await zohoInvoiceApi.getItem({ auth, organizationId, itemId });
		return await zohoInvoiceApi.updateItem({
			auth,
			organizationId,
			itemId,
			body: {
				...zohoInvoiceUtils.compact({
					name: current.item?.name,
					rate: current.item?.rate,
				}),
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
