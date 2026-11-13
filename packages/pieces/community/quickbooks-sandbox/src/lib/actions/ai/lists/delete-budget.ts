import { createAction } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksApi } from '../../../common/api';
import { quickbooksSandboxDeleteBudgetOutputSchema } from '../../../output-schemas';

export const deleteBudgetAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_delete_budget',
	outputSchema: quickbooksSandboxDeleteBudgetOutputSchema,
	displayName: 'Delete Budget',
	description: 'Permanently deletes a budget.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Deletes one budget; it cannot be restored, though Get Budget still returns it with Active false and status Deleted. Reads the latest SyncToken first. Needs QuickBooks Online Plus or Advanced. Get the id from List Budgets.',
		idempotent: false,
	},
	props: {
		budgetId: quickbooksAiProps.id({
			required: true,
			displayName: 'Budget ID',
			description: 'QuickBooks budget id. Use List Budgets to find it.',
		}),
	},
	async run(context) {
		return await quickbooksApi.deleteEntity({
			auth: context.auth,
			entity: 'Budget',
			id: context.propsValue.budgetId,
		});
	},
});
