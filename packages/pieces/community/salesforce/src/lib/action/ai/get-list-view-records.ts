import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { salesforceAuth } from '../../..';
import { callSalesforceApi } from '../../common';
import { salesforceUtils } from '../../common/utils';
import { getListViewRecordsOutputSchema } from '../../output-schemas';

export const getListViewRecords = createAction({
	auth: salesforceAuth,
	name: 'get_list_view_records',
	classification: 'READ',
	displayName: 'Get List View Records',
	description: 'Get the rows a list view shows, with its columns.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Returns the records of one list view (ids from List List Views) as flat rows keyed by the list view\'s columns, exactly as a user sees them. Use it to reuse a saved filter; for custom filtering write a SOQL query instead. Page with Offset; Limit defaults to 50, max 200. Read-only; safe to retry.',
		idempotent: true,
	},
	outputSchema: getListViewRecordsOutputSchema,
	props: {
		object: Property.ShortText({
			displayName: 'Object',
			description: 'Object API name, e.g. Account.',
			required: true,
		}),
		list_view_id: Property.ShortText({
			displayName: 'List View ID',
			required: true,
		}),
		limit: Property.Number({
			displayName: 'Limit',
			description: 'Rows to return (default 50, max 200).',
			required: false,
			defaultValue: 50,
		}),
		offset: Property.Number({
			displayName: 'Offset',
			description: 'Rows to skip, for paging.',
			required: false,
		}),
	},
	async run(context) {
		const object = salesforceUtils.assertApiName({ value: context.propsValue.object, fieldName: 'Object' });
		const listViewId = salesforceUtils.assertId({ value: context.propsValue.list_view_id, fieldName: 'List View ID' });
		const limit = Math.min(Math.max(Math.floor(context.propsValue.limit ?? 50), 1), 200);
		const offset = Math.max(Math.floor(context.propsValue.offset ?? 0), 0);
		const response = await callSalesforceApi(
			HttpMethod.GET,
			context.auth,
			`/services/data/v56.0/sobjects/${object}/listviews/${listViewId}/results?limit=${limit}&offset=${offset}`,
			undefined
		);
		const body: unknown = response.body;
		const result = salesforceUtils.isRecord(body) ? body : {};
		const records = (Array.isArray(result['records']) ? result['records'] : []).filter(salesforceUtils.isRecord).map(flattenRow);
		return {
			records,
			count: records.length,
			size: result['size'] ?? null,
			done: result['done'] ?? null,
		};
	},
});

function flattenRow(row: Record<string, unknown>): Record<string, unknown> {
	const cells = Array.isArray(row['columns']) ? row['columns'] : [];
	return Object.fromEntries(
		cells.filter(salesforceUtils.isRecord).map((cell) => [String(cell['fieldNameOrPath']), cell['value'] ?? null])
	);
}
