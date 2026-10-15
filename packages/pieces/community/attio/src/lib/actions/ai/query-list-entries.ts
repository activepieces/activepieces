import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { attioAuth } from '../../auth';
import { attioApiCall } from '../../common/client';
import { attioAi } from '../../common/ai';
import { attioQueryListEntriesOutputSchema } from '../../output-schemas';

export const attioQueryListEntriesAction = createAction({
	auth: attioAuth,
	name: 'attio_query_list_entries',
	outputSchema: attioQueryListEntriesOutputSchema,
	displayName: 'Query List Entries',
	description: 'Lists entries in a list, with optional filter and sort.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description: 'Lists entries of one list, optionally filtered and sorted by list or parent-record attributes, e.g. {"stage": "Won"}. Paginate with Limit and Offset.',
		idempotent: true,
	},
	props: {
		list: attioAi.listProp(),
		filter: Property.Json({
			displayName: 'Filter',
			description: 'Attio filter object, e.g. {"stage": "Won"}.',
			required: false,
		}),
		sorts: attioAi.sortsProp(),
		limit: attioAi.limitProp({ max: 500 }),
		offset: attioAi.offsetProp(),
	},
	async run(context) {
		const { list, filter, sorts, limit, offset } = context.propsValue;
		const response = await attioApiCall<{ data: Record<string, unknown>[] }>({
			accessToken: context.auth.secret_text,
			method: HttpMethod.POST,
			resourceUri: `/lists/${list}/entries/query`,
			body: attioAi.compact({ filter: attioAi.nonEmptyFilter(filter), sorts: sorts && sorts.length > 0 ? sorts : undefined, limit: limit ?? 50, offset }),
		});
		return { entries: response.data, count: response.data.length };
	},
});
