import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceListItemsOutputSchema } from '../../../output-schemas';

export const listItemsAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_list_items',
	outputSchema: zohoInvoiceListItemsOutputSchema,
	displayName: 'List Items',
	description: 'Lists the products and services of an organization.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists items (products and services) with item_id, name, rate, tax and status, one page at a time. Filter by status or search text. Use it to find the item IDs other actions need.',
		idempotent: true,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		filterBy: Property.StaticDropdown({
			displayName: 'Status',
			description: 'Only items with this status. Empty = all items.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'All', value: 'Status.All' },
					{ label: 'Active', value: 'Status.Active' },
					{ label: 'Inactive', value: 'Status.Inactive' },
				],
			},
		}),
		searchText: zohoInvoiceAiProps.searchText({
			required: false,
			description: 'Search items by name or description.',
		}),
		sortColumn: zohoInvoiceAiProps.sortColumn({
			required: false,
			description: 'Field to sort by: name, rate or tax_name.',
		}),
		page: zohoInvoiceAiProps.page({ required: false }),
		perPage: zohoInvoiceAiProps.perPage({ required: false }),
	},
	async run({ auth, propsValue }) {
		return await zohoInvoiceApi.listItems({
			auth,
			organizationId: propsValue.organizationId,
			filterBy: propsValue.filterBy,
			searchText: propsValue.searchText,
			sortColumn: propsValue.sortColumn,
			page: propsValue.page,
			perPage: propsValue.perPage,
		});
	},
});
