import { createAction } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksApi } from '../../../common/api';
import { quickbooksSandboxListPurchasesOutputSchema } from '../../../output-schemas';

export const listPurchasesAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_list_purchases',
	outputSchema: quickbooksSandboxListPurchasesOutputSchema,
	displayName: 'List Purchases',
	description: 'Lists purchases, optionally filtered.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists purchases (expenses, checks and credit card charges) one page at a time, with an optional QuickBooks query filter (e.g. "PaymentType = \'Check\'" or "TxnDate >= \'2025-01-01\'") and sort. Page with startPosition and the returned nextStartPosition (null on the last page).',
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
			entity: 'Purchase',
			where,
			orderBy,
			limit,
			startPosition,
		});
	},
});
