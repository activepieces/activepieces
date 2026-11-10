import { createAction } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksApi } from '../../../common/api';
import { quickbooksSandboxListCustomerTypesOutputSchema } from '../../../output-schemas';

export const listCustomerTypesAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_list_customer_types',
	outputSchema: quickbooksSandboxListCustomerTypesOutputSchema,
	displayName: 'List Customer Types',
	description: 'Lists customer types, optionally filtered.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists customer types one page at a time, with an optional QuickBooks query filter (e.g. "Name LIKE \'%Retail%\'") and sort. Page with startPosition and the returned nextStartPosition (null on the last page).',
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
			entity: 'CustomerType',
			where,
			orderBy,
			limit,
			startPosition,
		});
	},
});
