import { createAction } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceMessageOutputSchema } from '../../../output-schemas';

export const deleteExpenseCategoryAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_delete_expense_category',
	outputSchema: zohoInvoiceMessageOutputSchema,
	displayName: 'Delete Expense Category',
	description: 'Deletes an expense category.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Permanently deletes an expense category. Use List Expense Categories to find the ID. Categories used by expenses cannot be deleted; use Mark Expense Category Inactive instead. Cannot be undone.',
		idempotent: false,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		expenseCategoryId: zohoInvoiceAiProps.expenseCategoryId({ required: true }),
	},
	async run({ auth, propsValue }) {
		return await zohoInvoiceApi.deleteExpenseCategory({
			auth,
			organizationId: propsValue.organizationId,
			expenseCategoryId: propsValue.expenseCategoryId,
		});
	},
});
