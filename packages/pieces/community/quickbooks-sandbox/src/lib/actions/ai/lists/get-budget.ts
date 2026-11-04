import { createAction } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksApi } from '../../../common/api';
import { quickbooksSandboxGetBudgetOutputSchema } from '../../../output-schemas';

export const getBudgetAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_get_budget',
	outputSchema: quickbooksSandboxGetBudgetOutputSchema,
	displayName: 'Get Budget',
	description: 'Gets one budget by id.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Reads one budget with its period, type, per-account amounts (BudgetDetail) and SyncToken. Needs QuickBooks Online Plus or Advanced. Get the id from List Budgets or Create Budget.',
		idempotent: true,
	},
	props: {
		budgetId: quickbooksAiProps.id({
			required: true,
			displayName: 'Budget ID',
			description: 'QuickBooks budget id. Use List Budgets to find it.',
		}),
	},
	async run(context) {
		return await quickbooksApi.getEntity({
			auth: context.auth,
			entity: 'Budget',
			id: context.propsValue.budgetId,
		});
	},
});
