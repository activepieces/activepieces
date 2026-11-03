import { createAction } from '@activepieces/pieces-framework';

import { twentyAuth } from '../../auth';
import { twentyAiProps } from '../../common/ai-props';
import { twentyApi } from '../../common/api';
import { twentyListRecordsOutputSchema } from '../../output-schemas';

export const listRecordsAction = createAction({
	auth: twentyAuth,
	name: 'twenty_list_records',
	outputSchema: twentyListRecordsOutputSchema,
	displayName: 'List Records',
	description: 'Lists or searches records of any object, with filter, sort and cursor paging.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists records of one object (people, companies, opportunities, tasks, notes or a custom object), optionally narrowed by a Twenty filter expression and sorted. Use it to find a record by email, name or domain and get its id, or to page through records. Returns one page; pass `pageInfo.endCursor` back as Starting After with the same filter for the next page.',
		idempotent: true,
	},
	props: {
		objectNamePlural: twentyAiProps.objectNamePlural({ required: true }),
		filter: twentyAiProps.filter({ required: false }),
		orderBy: twentyAiProps.orderBy({ required: false }),
		limit: twentyAiProps.limit({ required: false }),
		startingAfter: twentyAiProps.startingAfter({ required: false }),
		depth: twentyAiProps.depth({ required: false }),
		fields: twentyAiProps.fields({ required: false }),
	},
	async run(context) {
		const { objectNamePlural, filter, orderBy, limit, startingAfter, depth, fields } =
			context.propsValue;
		return await twentyApi.listRecords({
			auth: context.auth,
			objectNamePlural,
			filter,
			orderBy,
			limit,
			startingAfter,
			depth,
			fields,
		});
	},
});
