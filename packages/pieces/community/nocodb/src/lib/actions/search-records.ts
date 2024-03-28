import { nocodbAuth } from '../../';
import { createAction, Property } from '@activepieces/pieces-framework';
import { makeClient, nocodbCommon } from '../common';

export const searchRecordsAction = createAction({
	auth: nocodbAuth,
	name: 'nocodb-search-records',
	displayName: 'Search Records',
	description: 'Returns a list of records matching the where condition.',
	props: {
		workspaceId: nocodbCommon.workspaceId,
		baseId: nocodbCommon.baseId,
		tableId: nocodbCommon.tableId,
		columnId: nocodbCommon.columnId,
		whereCondition: Property.LongText({
			displayName: 'Where',
			required: false,
			description: `Enables you to define specific conditions for filtering records.See docs [here](https://docs.nocodb.com/0.109.7/developer-resources/rest-apis/#comparison-operators).`,
		}),
		limit: Property.Number({
			displayName: 'Limit',
			required: true,
			defaultValue: 10,
			description: 'Enables you to set a limit on the number of records you want to retrieve.',
		}),
		sort: Property.LongText({
			displayName: 'Sort',
			required: false,
			description: `Comma separated field names without space.Example: **field1,-field2** will sort the records first by 'field1' in ascending order and then by 'field2' in descending order.`,
		}),
	},
	async run(context) {
		const { tableId, columnId, limit, whereCondition, sort } = context.propsValue;

		const client = makeClient(context.auth);
		const response = await client.listRecords(tableId, {
			fields: columnId ? columnId.join(',') : undefined,
			where: whereCondition,
			sort,
			offset: 0,
			limit,
		});
		return response.list;
	},
});
