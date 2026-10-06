import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { attioAuth } from '../../auth';
import { attioApiCall } from '../../common/client';
import { attioAi } from '../../common/ai';
import { AttioRecordResponse } from '../../common/types';
import { attioQueryRecordsOutputSchema } from '../../output-schemas';

export const attioQueryRecordsAction = createAction({
	auth: attioAuth,
	name: 'attio_query_records',
	outputSchema: attioQueryRecordsOutputSchema,
	displayName: 'Query Records',
	description: 'Lists records in an object, with optional filter and sort.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description: 'Lists records of one object, optionally filtered and sorted with Attio filter syntax, e.g. {"name": "Acme"} or {"email_addresses": {"$contains": "@acme.com"}}. Use Search Records for fuzzy text search across objects. Paginate with Limit and Offset.',
		idempotent: true,
	},
	props: {
		object: attioAi.objectProp(),
		filter: Property.Json({
			displayName: 'Filter',
			description: 'Attio filter object, e.g. {"name": "Acme"} or {"$and": [...]}.',
			required: false,
		}),
		sorts: attioAi.sortsProp(),
		limit: attioAi.limitProp({ max: 500 }),
		offset: attioAi.offsetProp(),
	},
	async run(context) {
		const { object, filter, sorts, limit, offset } = context.propsValue;
		const response = await attioApiCall<{ data: AttioRecordResponse[] }>({
			accessToken: context.auth.secret_text,
			method: HttpMethod.POST,
			resourceUri: `/objects/${object}/records/query`,
			body: attioAi.compact({ filter: attioAi.nonEmptyFilter(filter), sorts: sorts && sorts.length > 0 ? sorts : undefined, limit: limit ?? 50, offset }),
		});
		const records = response.data.map((record) => attioAi.flattenRecord(record));
		return { records, count: records.length };
	},
});
