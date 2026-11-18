import { createAction } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksApi } from '../../../common/api';
import { quickbooksSandboxListRecurringTransactionsOutputSchema } from '../../../output-schemas';

export const listRecurringTransactionsAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_list_recurring_transactions',
	outputSchema: quickbooksSandboxListRecurringTransactionsOutputSchema,
	displayName: 'List Recurring Transactions',
	description: 'Lists recurring transactions, optionally filtered.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists recurring transaction templates one page at a time, each wrapped in its transaction type (e.g. {"Invoice": {..., "RecurringInfo": {...}}}), with an optional QuickBooks query filter and sort. Needs QuickBooks Online Essentials or higher. Page with startPosition and the returned nextStartPosition (null on the last page).',
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
			entity: 'RecurringTransaction',
			where,
			orderBy,
			limit,
			startPosition,
		});
	},
});
