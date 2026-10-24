import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceUtils } from '../../../common/utils';
import { zohoInvoiceExpenseCategoryOutputSchema } from '../../../output-schemas';

export const updateExpenseCategoryAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_update_expense_category',
	outputSchema: zohoInvoiceExpenseCategoryOutputSchema,
	displayName: 'Update Expense Category',
	description: "Changes an expense category's name or description.",
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			"Changes an expense category's name or description. Fields left empty keep their current value. Use List Expense Categories to find the ID.",
		idempotent: true,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		expenseCategoryId: zohoInvoiceAiProps.expenseCategoryId({ required: true }),
		accountName: Property.ShortText({
			displayName: 'Name',
			description: 'New name. Empty = unchanged.',
			required: false,
		}),
		description: Property.LongText({
			displayName: 'Description',
			description: 'New description. Empty = unchanged.',
			required: false,
		}),
	},
	async run({ auth, propsValue }) {
		return await zohoInvoiceApi.updateExpenseCategory({
			auth,
			organizationId: propsValue.organizationId,
			expenseCategoryId: propsValue.expenseCategoryId,
			body: zohoInvoiceUtils.compact({
				account_name: propsValue.accountName,
				description: propsValue.description,
			}),
		});
	},
});
