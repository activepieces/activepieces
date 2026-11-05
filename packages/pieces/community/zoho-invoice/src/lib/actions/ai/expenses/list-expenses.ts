import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceListExpensesOutputSchema } from '../../../output-schemas';

export const listExpensesAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_list_expenses',
	outputSchema: zohoInvoiceListExpensesOutputSchema,
	displayName: 'List Expenses',
	description: 'Lists the expenses of an organization.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists expenses with expense_id, date, category, amount, customer and status, one page at a time. Filter by status, date range or search text. Use it to find the expense IDs other actions need.',
		idempotent: true,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		filterBy: Property.StaticDropdown({
			displayName: 'Status',
			description: 'Only expenses with this status. Empty = all expenses.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'All', value: 'Status.All' },
					{ label: 'Billable', value: 'Status.Billable' },
					{ label: 'Non-billable', value: 'Status.Nonbillable' },
					{ label: 'Reimbursed', value: 'Status.Reimbursed' },
					{ label: 'Invoiced', value: 'Status.Invoiced' },
					{ label: 'Unbilled', value: 'Status.Unbilled' },
				],
			},
		}),
		searchText: zohoInvoiceAiProps.searchText({
			required: false,
			description: 'Search by category name, description, customer name or vendor name.',
		}),
		dateStart: Property.ShortText({
			displayName: 'Date From',
			description: 'Only expenses dated on or after this date, yyyy-mm-dd.',
			required: false,
		}),
		dateEnd: Property.ShortText({
			displayName: 'Date To',
			description: 'Only expenses dated on or before this date, yyyy-mm-dd.',
			required: false,
		}),
		sortColumn: zohoInvoiceAiProps.sortColumn({
			required: false,
			description:
				'Field to sort by: date, account_name, total, bcy_total, reference_number, customer_name or created_time.',
		}),
		page: zohoInvoiceAiProps.page({ required: false }),
		perPage: zohoInvoiceAiProps.perPage({ required: false }),
	},
	async run({ auth, propsValue }) {
		return await zohoInvoiceApi.listExpenses({
			auth,
			organizationId: propsValue.organizationId,
			filterBy: propsValue.filterBy,
			searchText: propsValue.searchText,
			dateStart: propsValue.dateStart,
			dateEnd: propsValue.dateEnd,
			sortColumn: propsValue.sortColumn,
			page: propsValue.page,
			perPage: propsValue.perPage,
		});
	},
});
