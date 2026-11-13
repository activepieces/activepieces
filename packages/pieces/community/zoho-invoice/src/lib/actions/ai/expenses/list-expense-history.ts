import { createAction } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceListExpenseHistoryOutputSchema } from '../../../output-schemas';

export const listExpenseHistoryAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_list_expense_history',
	outputSchema: zohoInvoiceListExpenseHistoryOutputSchema,
	displayName: 'List Expense History',
	description: 'Lists the history and comments of an expense.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists the history entries and comments recorded on one expense. Use List Expenses to find the ID.',
		idempotent: true,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		expenseId: zohoInvoiceAiProps.expenseId({ required: true }),
	},
	async run({ auth, propsValue }) {
		return await zohoInvoiceApi.listExpenseHistory({
			auth,
			organizationId: propsValue.organizationId,
			expenseId: propsValue.expenseId,
		});
	},
});
