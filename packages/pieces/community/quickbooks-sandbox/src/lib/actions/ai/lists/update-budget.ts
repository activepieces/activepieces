import { createAction, Property } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksApi } from '../../../common/api';
import { quickbooksUtils } from '../../../common/utils';
import { quickbooksSandboxCreateBudgetOutputSchema } from '../../../output-schemas';

export const updateBudgetAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_update_budget',
	outputSchema: quickbooksSandboxCreateBudgetOutputSchema,
	displayName: 'Update Budget',
	description: 'Changes fields of an existing budget.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Changes only the fields you set on one budget: it reads the current budget and sends it back with your changes, so unset fields keep their values. Setting Budget Details replaces every amount, so pass the full list (from Get Budget) with your changes. Needs QuickBooks Online Plus or Advanced. Get the id from List Budgets.',
		idempotent: true,
	},
	props: {
		budgetId: quickbooksAiProps.id({
			required: true,
			displayName: 'Budget ID',
			description: 'QuickBooks budget id. Use List Budgets to find it.',
		}),
		name: Property.ShortText({ displayName: 'Name', description: 'New budget name.', required: false }),
		startDate: quickbooksAiProps.date({
			required: false,
			displayName: 'Start Date',
			description: 'New first day of the budget, YYYY-MM-DD.',
		}),
		endDate: quickbooksAiProps.date({
			required: false,
			displayName: 'End Date',
			description: 'New last day of the budget, YYYY-MM-DD.',
		}),
		budgetType: quickbooksAiProps.budgetType({
			required: false,
			displayName: 'Budget Type',
			description: 'New budget type.',
		}),
		budgetEntryType: quickbooksAiProps.budgetEntryType({
			required: false,
			displayName: 'Entry Period',
			description: 'New length of each budget period.',
		}),
		budgetDetails: quickbooksAiProps.lines({
			required: false,
			displayName: 'Budget Details',
			description:
				'JSON array that replaces every amount, e.g. [{"BudgetDate": "2025-01-01", "Amount": 1000, "AccountRef": {"value": "7"}}].',
		}),
		additionalFields: quickbooksAiProps.additionalFields({ required: false }),
	},
	async run(context) {
		const { budgetId, name, startDate, endDate, budgetType, budgetEntryType, budgetDetails, additionalFields } =
			context.propsValue;
		const fields = quickbooksUtils.requireChanges({
			fields: {
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
		return await quickbooksApi.replaceEntity({ auth: context.auth, entity: 'Budget', id: budgetId, fields });
	},
});
