import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceListExpenseCategoriesOutputSchema } from '../../../output-schemas';

export const listExpenseCategoriesAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_list_expense_categories',
	outputSchema: zohoInvoiceListExpenseCategoriesOutputSchema,
	displayName: 'List Expense Categories',
	description: 'Lists the expense categories of an organization.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists expense categories with their account_id, name and status, one page at a time. The account_id is the category ID that expense actions take.',
		idempotent: true,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		filterBy: Property.StaticDropdown({
			displayName: 'Status',
			description: 'Only categories with this status. Empty = the vendor default.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'All', value: 'ExpenseCategories.All' },
					{ label: 'Active', value: 'ExpenseCategories.Active' },
					{ label: 'Inactive', value: 'ExpenseCategories.Inactive' },
				],
			},
		}),
		page: zohoInvoiceAiProps.page({ required: false }),
		perPage: zohoInvoiceAiProps.perPage({ required: false }),
	},
	async run({ auth, propsValue }) {
		return await zohoInvoiceApi.listExpenseCategories({
			auth,
			organizationId: propsValue.organizationId,
			filterBy: propsValue.filterBy,
			page: propsValue.page,
			perPage: propsValue.perPage,
		});
	},
});
