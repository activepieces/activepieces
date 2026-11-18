import { createAction } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceMessageOutputSchema } from '../../../output-schemas';

export const markExpenseCategoryActiveAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_mark_expense_category_active',
	outputSchema: zohoInvoiceMessageOutputSchema,
	displayName: 'Mark Expense Category Active',
	description: 'Marks an inactive expense category as active.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Reactivates an expense category so new expenses can use it. Use List Expense Categories to find the ID.',
		idempotent: true,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		expenseCategoryId: zohoInvoiceAiProps.expenseCategoryId({ required: true }),
	},
	async run({ auth, propsValue }) {
		return await zohoInvoiceApi.markExpenseCategoryActive({
			auth,
			organizationId: propsValue.organizationId,
			expenseCategoryId: propsValue.expenseCategoryId,
		});
	},
});
