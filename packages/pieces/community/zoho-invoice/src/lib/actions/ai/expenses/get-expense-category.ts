import { createAction } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceExpenseCategoryOutputSchema } from '../../../output-schemas';

export const getExpenseCategoryAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_get_expense_category',
	outputSchema: zohoInvoiceExpenseCategoryOutputSchema,
	displayName: 'Get Expense Category',
	description: 'Gets one expense category by ID.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Returns one expense category by ID: name, description and status. Use List Expense Categories to find the ID.',
		idempotent: true,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		expenseCategoryId: zohoInvoiceAiProps.expenseCategoryId({ required: true }),
	},
	async run({ auth, propsValue }) {
		return await zohoInvoiceApi.getExpenseCategory({
			auth,
			organizationId: propsValue.organizationId,
			expenseCategoryId: propsValue.expenseCategoryId,
		});
	},
});
