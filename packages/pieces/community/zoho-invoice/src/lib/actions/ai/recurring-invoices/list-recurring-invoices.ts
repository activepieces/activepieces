import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceListRecurringInvoicesOutputSchema } from '../../../output-schemas';

export const listRecurringInvoicesAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_list_recurring_invoices',
	outputSchema: zohoInvoiceListRecurringInvoicesOutputSchema,
	displayName: 'List Recurring Invoices',
	description: 'Lists recurring invoice profiles.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists recurring invoice profiles with recurring_invoice_id, name, customer, frequency, status and next invoice date, one page at a time. Filter by status or search by customer name or reference.',
		idempotent: true,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		filterBy: Property.StaticDropdown({
			displayName: 'Status',
			description: 'Only profiles with this status. Empty = all profiles.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'All', value: 'Status.All' },
					{ label: 'Active', value: 'Status.Active' },
					{ label: 'Stopped', value: 'Status.Stopped' },
					{ label: 'Expired', value: 'Status.Expired' },
				],
			},
		}),
		searchText: zohoInvoiceAiProps.searchText({
			required: false,
			description: 'Search by invoice number, purchase order or customer name.',
		}),
		sortColumn: zohoInvoiceAiProps.sortColumn({ required: false }),
		page: zohoInvoiceAiProps.page({ required: false }),
		perPage: zohoInvoiceAiProps.perPage({ required: false }),
	},
	async run({ auth, propsValue }) {
		return await zohoInvoiceApi.listRecurringInvoices({
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
