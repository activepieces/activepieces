import { createAction } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksApi } from '../../../common/api';
import { quickbooksSandboxListRefundReceiptsOutputSchema } from '../../../output-schemas';

export const listRefundReceiptsAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_list_refund_receipts',
	outputSchema: quickbooksSandboxListRefundReceiptsOutputSchema,
	displayName: 'List Refund Receipts',
	description: 'Lists refund receipts, optionally filtered.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists refund receipts one page at a time, with an optional QuickBooks query filter (e.g. "CustomerRef = \'58\'" or "TxnDate >= \'2025-01-01\'") and sort. Page with startPosition and the returned nextStartPosition (null on the last page).',
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
			entity: 'RefundReceipt',
			where,
			orderBy,
			limit,
			startPosition,
		});
	},
});
