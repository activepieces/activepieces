import { createAction } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksApi } from '../../../common/api';
import { quickbooksSandboxListBudgetsOutputSchema } from '../../../output-schemas';

export const listBudgetsAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_list_budgets',
	outputSchema: quickbooksSandboxListBudgetsOutputSchema,
	displayName: 'List Budgets',
	description: 'Lists budgets, optionally filtered.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists budgets one page at a time, with an optional QuickBooks query filter (e.g. "Name LIKE \'2025%\'") and sort. Needs QuickBooks Online Plus or Advanced. Page with startPosition and the returned nextStartPosition (null on the last page).',
		idempotent: true,
	},
	props: {
		where: quickbooksAiProps.where({ required: false }),
		orderBy: quickbooksAiProps.orderBy({ required: false }),
		limit: quickbooksAiProps.limit({ required: false }),
		startPosition: quickbooksAiProps.startPosition({ required: false }),
	},
	async run(context) {
		const { where, orderBy, limit, startPosition } = context.propsValue;
		return await quickbooksApi.listEntities({
			auth: context.auth,
			entity: 'Budget',
			where,
			orderBy,
			limit,
			startPosition,
		});
	},
});
