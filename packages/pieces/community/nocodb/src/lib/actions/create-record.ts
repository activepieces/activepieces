import { nocodbAuth } from '../../';
import { createAction, DynamicPropsValue } from '@activepieces/pieces-framework';
import { makeClient, nocodbCommon } from '../common';

export const createRecordAction = createAction({
	auth: nocodbAuth,
	name: 'nocodb-create-record',
	displayName: 'Create a Record',
	description: 'Creates a new record in the given table.',
	props: {
		workspaceId: nocodbCommon.workspaceId,
		baseId: nocodbCommon.baseId,
		tableId: nocodbCommon.tableId,
		tableColumns: nocodbCommon.tableColumns,
	},
	async run(context) {
		const { baseId, tableId, tableColumns } = context.propsValue;
		const recordInput: DynamicPropsValue = {};

		Object.entries(tableColumns).forEach(([key, value]) => {
			if (Array.isArray(value)) {
				recordInput[key] = value.join(',');
			} else {
				recordInput[key] = value;
			}
		});

		const client = makeClient(context.auth);
		return await client.createRecord(baseId, tableId, recordInput, context.auth.props.version || 3);
	},
});
