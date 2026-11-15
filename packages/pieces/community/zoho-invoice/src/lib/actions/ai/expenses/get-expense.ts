import { createAction } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceExpenseOutputSchema } from '../../../output-schemas';

export const getExpenseAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_get_expense',
	outputSchema: zohoInvoiceExpenseOutputSchema,
	displayName: 'Get Expense',
	description: 'Gets one expense by ID.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Returns one expense by ID: date, amount, category, customer, project, tax, billable status and receipt. Use List Expenses to find the ID.',
		idempotent: true,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		expenseId: zohoInvoiceAiProps.expenseId({ required: true }),
	},
	async run({ auth, propsValue }) {
		return await zohoInvoiceApi.getExpense({
			auth,
			organizationId: propsValue.organizationId,
			expenseId: propsValue.expenseId,
		});
	},
});
