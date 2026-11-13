import { Property, createAction } from '@activepieces/pieces-framework';
import { smartsuiteAuth } from '../../auth';
import { smartSuiteApi } from '../../common';
import { smartSuiteClient } from '../../common/client';
import { smartSuiteInputs } from '../../common/inputs';
import { outputSchemas } from '../../output-schemas';

export const listRecordsAi = createAction({
	name: 'list_records',
	classification: 'SEARCH',
	displayName: 'List Records (by Table ID)',
	description: 'Lists one page of records from a table, with an optional filter and sort.',
	audience: 'ai',
	aiMetadata: {
		description: 'Returns one page of records from a SmartSuite table, keyed by field slug, plus total and hasMore. Filter is SmartSuite filter JSON, for example {"operator":"and","fields":[{"field":"status","comparison":"is","value":"complete"}]}; sort is an array like [{"field":"first_created","direction":"desc"}]. Use Get Table Schema (by ID) to learn field slugs. Page with offset. Read-only and idempotent.',
		idempotent: true,
	},
	auth: smartsuiteAuth,
	props: {
		tableId: smartSuiteInputs.aiProps.tableId(),
		filter: Property.Json({
			displayName: 'Filter',
			description: 'SmartSuite filter object: {"operator":"and"|"or","fields":[{"field":"<slug>","comparison":"is","value":"..."}]}. Leave empty for all records.',
			required: false,
		}),
		sort: Property.Json({
			displayName: 'Sort',
			description: 'Array of {"field":"<slug>","direction":"asc"|"desc"}.',
			required: false,
		}),
		limit: smartSuiteInputs.aiProps.limit(100),
		offset: smartSuiteInputs.aiProps.offset(),
	},
	outputSchema: outputSchemas['recordPage'],
	async run({ auth, propsValue }) {
		const filter = smartSuiteInputs.optionalJson({ value: propsValue.filter, label: 'Filter' });
		if (filter !== undefined && !smartSuiteInputs.isPlainObject(filter)) {
			throw new Error('Filter must be a JSON object with "operator" and "fields".');
		}
		const sort = smartSuiteInputs.optionalJson({ value: propsValue.sort, label: 'Sort' });
		if (sort !== undefined && !Array.isArray(sort)) {
			throw new Error('Sort must be a JSON array of {"field","direction"} objects.');
		}
		return smartSuiteApi.listRecordsPage({
			credentials: smartSuiteClient.credentialsOf(auth),
			tableId: propsValue.tableId,
			filter,
			sort,
			limit: smartSuiteInputs.integerInRange({ value: propsValue.limit, label: 'Limit', min: 1, max: smartSuiteApi.MAX_RECORD_PAGE_SIZE, fallback: 100 }),
			offset: smartSuiteInputs.integerInRange({ value: propsValue.offset, label: 'Offset', min: 0, max: Number.MAX_SAFE_INTEGER, fallback: 0 }),
		});
	},
});
