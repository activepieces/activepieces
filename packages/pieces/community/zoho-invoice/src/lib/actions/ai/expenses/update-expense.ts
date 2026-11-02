import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceUtils } from '../../../common/utils';
import { zohoInvoiceExpenseOutputSchema } from '../../../output-schemas';

export const updateExpenseAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_update_expense',
	outputSchema: zohoInvoiceExpenseOutputSchema,
	displayName: 'Update Expense',
	description: 'Changes the details of an expense.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			"Changes an expense's category, amount, reference, date, description, customer, project or billable flag, and can remove its receipt. Fields left empty keep their current value. Use List Expenses for the expense ID and List Expense Categories for the category ID.",
		idempotent: true,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		expenseId: zohoInvoiceAiProps.expenseId({ required: true }),
		accountId: zohoInvoiceAiProps.expenseCategoryId({
			required: false,
			description:
				'New expense category ID. Use List Expense Categories to find it. Empty = unchanged.',
		}),
		amount: Property.Number({
			displayName: 'Amount',
			description: 'New total amount. Empty = unchanged.',
			required: false,
		}),
		referenceNumber: Property.ShortText({
			displayName: 'Reference Number',
			description: 'New reference number. Empty = unchanged.',
			required: false,
		}),
		date: Property.ShortText({
			displayName: 'Date',
			description: 'New expense date, yyyy-mm-dd. Empty = unchanged.',
			required: false,
		}),
		description: Property.LongText({
			displayName: 'Description',
			description: 'New description. Empty = unchanged.',
			required: false,
		}),
		customerId: zohoInvoiceAiProps.contactId({
			required: false,
			description: 'New customer ID. Use List Contacts to find it. Empty = unchanged.',
		}),
		projectId: zohoInvoiceAiProps.projectId({
			required: false,
			description: 'New project ID. Use List Projects to find it. Empty = unchanged.',
		}),
		isBillable: zohoInvoiceAiProps.yesNo({
			required: false,
			displayName: 'Billable',
			description: 'Whether the expense can be billed to the customer. Empty = unchanged.',
		}),
		taxId: zohoInvoiceAiProps.taxId({
			required: false,
			description: 'New tax ID. Use List Taxes to find it. Empty = unchanged.',
		}),
		deleteReceipt: zohoInvoiceAiProps.yesNo({
			required: false,
			displayName: 'Delete Receipt',
			description: 'Yes = remove the receipt attached to the expense. Empty = keep it.',
		}),
		additionalFields: zohoInvoiceAiProps.additionalFields({ required: false }),
	},
	async run({ auth, propsValue }) {
		const { organizationId, expenseId } = propsValue;
		const current = await zohoInvoiceApi.getExpense({ auth, organizationId, expenseId });
		return await zohoInvoiceApi.updateExpense({
			auth,
			organizationId,
			expenseId,
			deleteReceipt: zohoInvoiceUtils.toOptionalBoolean({ value: propsValue.deleteReceipt }),
			body: {
				...zohoInvoiceUtils.compact({
					amount: current.expense?.amount,
					reference_number: current.expense?.reference_number,
				}),
				...(propsValue.additionalFields ?? {}),
				...zohoInvoiceUtils.compact({
					account_id: propsValue.accountId,
					amount: propsValue.amount,
					reference_number: propsValue.referenceNumber,
					date: propsValue.date,
					description: propsValue.description,
					customer_id: propsValue.customerId,
					project_id: propsValue.projectId,
					is_billable: zohoInvoiceUtils.toOptionalBoolean({ value: propsValue.isBillable }),
					tax_id: propsValue.taxId,
				}),
			},
		});
	},
});
