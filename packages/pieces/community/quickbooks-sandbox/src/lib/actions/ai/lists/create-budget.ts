import { createAction, Property } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksApi } from '../../../common/api';
import { quickbooksUtils } from '../../../common/utils';
import { quickbooksSandboxCreateBudgetOutputSchema } from '../../../output-schemas';

export const createBudgetAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_create_budget',
	outputSchema: quickbooksSandboxCreateBudgetOutputSchema,
	displayName: 'Create Budget',
	description: 'Creates a budget with per-account amounts.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Creates a budget for a date range with planned amounts per account and period; account ids come from List Accounts. Needs QuickBooks Online Plus or Advanced. Not idempotent: each call creates a new budget.',
		idempotent: false,
	},
	props: {
		name: Property.ShortText({
			displayName: 'Name',
			description: 'Budget name, e.g. "FY2025 Operating Budget".',
			required: true,
		}),
		startDate: quickbooksAiProps.date({
			required: true,
			displayName: 'Start Date',
			description: 'First day of the budget, YYYY-MM-DD.',
		}),
		endDate: quickbooksAiProps.date({
			required: true,
			displayName: 'End Date',
			description: 'Last day of the budget, YYYY-MM-DD.',
		}),
		budgetType: quickbooksAiProps.budgetType({
			required: false,
			displayName: 'Budget Type',
			description: 'Profit and loss (income and expense accounts) or balance sheet.',
		}),
		budgetEntryType: quickbooksAiProps.budgetEntryType({
			required: false,
			displayName: 'Entry Period',
			description: 'Length of each budget period.',
		}),
		budgetDetails: quickbooksAiProps.lines({
			required: false,
			displayName: 'Budget Details',
			description:
				'JSON array with one amount per account and period, e.g. [{"BudgetDate": "2025-01-01", "Amount": 1000, "AccountRef": {"value": "7"}}]. BudgetDate is the first day of the period. Optional CustomerRef, ClassRef and DepartmentRef narrow an amount.',
		}),
		additionalFields: quickbooksAiProps.additionalFields({ required: false }),
	},
	async run(context) {
		const { name, startDate, endDate, budgetType, budgetEntryType, budgetDetails, additionalFields } = context.propsValue;
		return await quickbooksApi.createEntity({
			auth: context.auth,
			entity: 'Budget',
			body: {
				...additionalFields,
				...quickbooksUtils.compact({
					fields: {
						Name: name,
						StartDate: startDate,
						EndDate: endDate,
						BudgetType: budgetType,
						BudgetEntryType: budgetEntryType,
						BudgetDetail: quickbooksUtils.linesArray({ lines: budgetDetails, propName: 'Budget Details' }),
					},
				}),
			},
		});
	},
});


