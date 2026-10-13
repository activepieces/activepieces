import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { salesforceAuth } from '../../..';
import { callSalesforceApi } from '../../common';
import { salesforceUtils } from '../../common/utils';
import { getListViewMetadataOutputSchema } from '../../output-schemas';

export const getListViewMetadata = createAction({
	auth: salesforceAuth,
	name: 'get_list_view_metadata',
	classification: 'READ',
	displayName: 'Get List View Metadata',
	description: 'Get the columns, filters and SOQL query behind a list view.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Returns the columns, ordering, filter and underlying SOQL query of one list view (ids from List List Views). Use it to reuse or adapt the list view\'s query; to read its rows directly use Get List View Records. Read-only; safe to retry.',
		idempotent: true,
	},
	outputSchema: getListViewMetadataOutputSchema,
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
	},
	async run(context) {
		const object = salesforceUtils.assertApiName({ value: context.propsValue.object, fieldName: 'Object' });
		const listViewId = salesforceUtils.assertId({ value: context.propsValue.list_view_id, fieldName: 'List View ID' });
		const response = await callSalesforceApi(
			HttpMethod.GET,
			context.auth,
			`/services/data/v56.0/sobjects/${object}/listviews/${listViewId}/describe`,
			undefined
		);
		const body: unknown = response.body;
		const result = salesforceUtils.isRecord(body) ? body : {};
		const columns = (Array.isArray(result['columns']) ? result['columns'] : []).filter(salesforceUtils.isRecord).map((column) => ({
			field_name_or_path: column['fieldNameOrPath'] ?? null,
			label: column['label'] ?? null,
			sortable: column['sortable'] ?? null,
			type: column['type'] ?? null,
		}));
		return {
			id: result['id'] ?? listViewId,
			sobject_type: result['sobjectType'] ?? object,
			query: result['query'] ?? null,
			columns,
			order_by: result['orderBy'] ?? null,
			where_condition: result['whereCondition'] ?? null,
		};
	},
});
