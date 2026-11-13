import { createAction } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksApi } from '../../../common/api';
import { quickbooksSandboxListItemsOutputSchema } from '../../../output-schemas';

export const listItemsAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_list_items',
	outputSchema: quickbooksSandboxListItemsOutputSchema,
	displayName: 'List Items',
	description: 'Lists products and services, optionally filtered.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists items (products and services) one page at a time, with an optional QuickBooks query filter (e.g. "Type = \'Inventory\'", "Name LIKE \'%Widget%\'" or "Active = false") and sort. Only active items are returned unless the filter names Active. Page with startPosition and the returned nextStartPosition (null on the last page).',
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
			entity: 'Item',
			where,
			orderBy,
			limit,
			startPosition,
		});
	},
});
