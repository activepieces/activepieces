import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceUtils } from '../../../common/utils';
import { zohoInvoiceExpenseCategoryOutputSchema } from '../../../output-schemas';

export const createExpenseCategoryAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_create_expense_category',
	outputSchema: zohoInvoiceExpenseCategoryOutputSchema,
	displayName: 'Create Expense Category',
	description: 'Creates an expense category.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Creates an expense category that expenses are recorded under. Not idempotent: use List Expense Categories first to avoid duplicates.',
		idempotent: false,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		accountName: Property.ShortText({
			displayName: 'Name',
			description: 'Name of the expense category, e.g. "Travel".',
			required: true,
		}),
		description: Property.LongText({
			displayName: 'Description',
			description: 'Description of the category.',
			required: false,
		}),
	},
	async run({ auth, propsValue }) {
		return await zohoInvoiceApi.createExpenseCategory({
			auth,
			organizationId: propsValue.organizationId,
			body: zohoInvoiceUtils.compact({
				account_name: propsValue.accountName,
				description: propsValue.description,
			}),
		});
	},
});
