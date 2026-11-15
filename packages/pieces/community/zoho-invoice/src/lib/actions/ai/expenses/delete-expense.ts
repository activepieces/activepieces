import { createAction } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceMessageOutputSchema } from '../../../output-schemas';

export const deleteExpenseAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_delete_expense',
	outputSchema: zohoInvoiceMessageOutputSchema,
	displayName: 'Delete Expense',
	description: 'Deletes an expense.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Permanently deletes an expense. Use List Expenses to find the ID. Cannot be undone.',
		idempotent: false,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		expenseId: zohoInvoiceAiProps.expenseId({ required: true }),
	},
	async run({ auth, propsValue }) {
		return await zohoInvoiceApi.deleteExpense({
			auth,
			organizationId: propsValue.organizationId,
			expenseId: propsValue.expenseId,
		});
	},
});
