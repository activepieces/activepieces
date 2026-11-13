import { createAction } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksApi } from '../../../common/api';
import { quickbooksSandboxListCustomersOutputSchema } from '../../../output-schemas';

export const listCustomersAiAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_list_customers',
	outputSchema: quickbooksSandboxListCustomersOutputSchema,
	displayName: 'List Customers',
	description: 'Lists customers, optionally filtered.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists customers one page at a time, with an optional QuickBooks query filter (e.g. "DisplayName LIKE \'%Acme%\'" or "PrimaryEmailAddr = \'jo@example.com\'") and sort. Only active customers are returned unless the filter includes "Active = false". Page with startPosition and the returned nextStartPosition (null on the last page).',
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
			entity: 'Customer',
			where,
			orderBy,
			limit,
			startPosition,
		});
	},
});
