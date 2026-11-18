import { createAction } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceMessageOutputSchema } from '../../../output-schemas';

export const markExpenseCategoryInactiveAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_mark_expense_category_inactive',
	outputSchema: zohoInvoiceMessageOutputSchema,
	displayName: 'Mark Expense Category Inactive',
	description: 'Marks an expense category as inactive.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Deactivates an expense category so new expenses cannot use it, keeping existing expenses. Use List Expense Categories to find the ID.',
		idempotent: true,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		expenseCategoryId: zohoInvoiceAiProps.expenseCategoryId({ required: true }),
	},
	async run({ auth, propsValue }) {
		return await zohoInvoiceApi.markExpenseCategoryInactive({
			auth,
			organizationId: propsValue.organizationId,
			expenseCategoryId: propsValue.expenseCategoryId,
		});
	},
});
