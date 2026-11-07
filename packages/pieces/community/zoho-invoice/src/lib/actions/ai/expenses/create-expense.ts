import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceUtils } from '../../../common/utils';
import { zohoInvoiceExpenseOutputSchema } from '../../../output-schemas';

export const createExpenseAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_create_expense',
	outputSchema: zohoInvoiceExpenseOutputSchema,
	displayName: 'Create Expense',
	description: 'Records an expense.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Records an expense under an expense category, optionally billable to a customer or project. Use List Expense Categories for the category ID. Not idempotent: each call records a new expense, so use List Expenses first to avoid duplicates.',
		idempotent: false,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		accountId: zohoInvoiceAiProps.expenseCategoryId({
			required: true,
			description:
				'Expense category ID the expense is recorded under. Use List Expense Categories to find it.',
		}),
		amount: Property.Number({
			displayName: 'Amount',
			description: 'Total amount of the expense.',
			required: true,
		}),
		referenceNumber: Property.ShortText({
			displayName: 'Reference Number',
			description: 'Reference number of the expense, e.g. a receipt number (max 100 characters).',
			required: true,
		}),
		date: Property.ShortText({
			displayName: 'Date',
			description: 'Expense date, yyyy-mm-dd. Empty = today.',
			required: false,
		}),
		description: Property.LongText({
			displayName: 'Description',
			description: 'Description of the expense.',
			required: false,
		}),
		customerId: zohoInvoiceAiProps.contactId({
			required: false,
			description: 'Customer the expense relates to. Use List Contacts to find it.',
		}),
		projectId: zohoInvoiceAiProps.projectId({ required: false }),
		isBillable: zohoInvoiceAiProps.yesNo({
			required: false,
			displayName: 'Billable',
			description: 'Whether the expense can be billed to the customer. Empty = the vendor default.',
		}),
		currencyId: zohoInvoiceAiProps.currencyId({
			required: false,
			description:
				'Currency of the expense. Use List Currencies to find it. Empty = base currency.',
		}),
		taxId: zohoInvoiceAiProps.taxId({ required: false }),
		isInclusiveTax: zohoInvoiceAiProps.yesNo({
			required: false,
			displayName: 'Tax Inclusive',
			description: 'Whether the amount includes tax. Empty = the vendor default.',
		}),
		additionalFields: zohoInvoiceAiProps.additionalFields({ required: false }),
	},
	async run({ auth, propsValue }) {
		return await zohoInvoiceApi.createExpense({
			auth,
			organizationId: propsValue.organizationId,
			body: {
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
					currency_id: propsValue.currencyId,
					tax_id: propsValue.taxId,
					is_inclusive_tax: zohoInvoiceUtils.toOptionalBoolean({
						value: propsValue.isInclusiveTax,
					}),
				}),
			},
		});
	},
});
