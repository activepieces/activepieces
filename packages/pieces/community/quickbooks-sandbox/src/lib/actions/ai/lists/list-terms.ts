import { createAction } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksApi } from '../../../common/api';
import { quickbooksSandboxListTermsOutputSchema } from '../../../output-schemas';

export const listTermsAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_list_terms',
	outputSchema: quickbooksSandboxListTermsOutputSchema,
	displayName: 'List Terms',
	description: 'Lists terms, optionally filtered.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists payment terms (e.g. Net 30) one page at a time, with an optional QuickBooks query filter (e.g. "Name LIKE \'Net%\'") and sort. Inactive terms are left out unless the filter asks for them (e.g. "Active = false"). Page with startPosition and the returned nextStartPosition (null on the last page).',
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
			entity: 'Term',
			where,
			orderBy,
			limit,
			startPosition,
		});
	},
});
