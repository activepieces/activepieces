import { createAction } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksApi } from '../../../common/api';
import { quickbooksSandboxListBillsOutputSchema } from '../../../output-schemas';

export const listBillsAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_list_bills',
	outputSchema: quickbooksSandboxListBillsOutputSchema,
	displayName: 'List Bills',
	description: 'Lists bills, optionally filtered.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists bills one page at a time, with an optional QuickBooks query filter (e.g. "VendorRef = \'56\'" or "Balance > \'0\'") and sort. Page with startPosition and the returned nextStartPosition (null on the last page).',
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
			entity: 'Bill',
			where,
			orderBy,
			limit,
			startPosition,
		});
	},
});
