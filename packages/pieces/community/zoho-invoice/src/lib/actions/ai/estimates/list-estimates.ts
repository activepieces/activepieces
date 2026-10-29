import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceListEstimatesOutputSchema } from '../../../output-schemas';

export const listEstimatesAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_list_estimates',
	outputSchema: zohoInvoiceListEstimatesOutputSchema,
	displayName: 'List Estimates',
	description: 'Lists estimates (quotes).',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists estimates with estimate_id, number, customer, status, date and total, one page at a time. Filter by status or customer, or search by number, reference or customer name.',
		idempotent: true,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		filterBy: Property.StaticDropdown({
			displayName: 'Status',
			description: 'Only estimates with this status. Empty = all estimates.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'All', value: 'Status.All' },
					{ label: 'Draft', value: 'Status.Draft' },
					{ label: 'Sent', value: 'Status.Sent' },
					{ label: 'Accepted', value: 'Status.Accepted' },
					{ label: 'Declined', value: 'Status.Declined' },
					{ label: 'Invoiced', value: 'Status.Invoiced' },
					{ label: 'Expired', value: 'Status.Expired' },
				],
			},
		}),
		searchText: zohoInvoiceAiProps.searchText({
			required: false,
			description: 'Search by estimate number, reference number or customer name.',
		}),
		customerId: zohoInvoiceAiProps.contactId({
			required: false,
			displayName: 'Customer ID',
			description: 'Only estimates of this customer. Use List Contacts to find it.',
		}),
		sortColumn: Property.StaticDropdown({
			displayName: 'Sort Column',
			description: 'Field to sort by. Empty = the vendor default.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'Customer Name', value: 'customer_name' },
					{ label: 'Estimate Number', value: 'estimate_number' },
					{ label: 'Date', value: 'date' },
					{ label: 'Total', value: 'total' },
					{ label: 'Created Time', value: 'created_time' },
				],
			},
		}),
		sortOrder: zohoInvoiceAiProps.sortOrder({ required: false }),
		page: zohoInvoiceAiProps.page({ required: false }),
		perPage: zohoInvoiceAiProps.perPage({ required: false }),
	},
	async run({ auth, propsValue }) {
		return await zohoInvoiceApi.listEstimates({
			auth,
			organizationId: propsValue.organizationId,
			filterBy: propsValue.filterBy,
			searchText: propsValue.searchText,
			customerId: propsValue.customerId,
			sortColumn: propsValue.sortColumn,
			sortOrder: propsValue.sortOrder,
			page: propsValue.page,
			perPage: propsValue.perPage,
		});
	},
});
