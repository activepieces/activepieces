import { createAction } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksApi } from '../../../common/api';
import { quickbooksSandboxListClassesOutputSchema } from '../../../output-schemas';

export const listClassesAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_list_classes',
	outputSchema: quickbooksSandboxListClassesOutputSchema,
	displayName: 'List Classes',
	description: 'Lists classes, optionally filtered.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists classes one page at a time, with an optional QuickBooks query filter (e.g. "Name LIKE \'East%\'") and sort. Needs QuickBooks Online Plus or Advanced with class tracking on. Inactive classes are left out unless the filter asks for them (e.g. "Active = false"). Page with startPosition and the returned nextStartPosition (null on the last page).',
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
			entity: 'Class',
			where,
			orderBy,
			limit,
			startPosition,
		});
	},
});
