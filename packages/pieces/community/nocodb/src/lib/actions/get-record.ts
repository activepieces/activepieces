import { nocodbAuth } from '../../';
import { createAction, Property } from '@activepieces/pieces-framework';
import { makeClient, nocodbCommon } from '../common';

export const getRecordAction = createAction({
	auth: nocodbAuth,
	name: 'nocodb-get-record',
	displayName: 'Get a Record',
	description: 'Gets a record by the Record ID.',
	props: {
		workspaceId: nocodbCommon.workspaceId,
		baseId: nocodbCommon.baseId,
		tableId: nocodbCommon.tableId,
		recordId: Property.Number({
			displayName: 'Record ID',
			required: true,
		}),
	},
	async run(context) {
		const { tableId, recordId } = context.propsValue;

		const client = makeClient(context.auth);
		return await client.getRecord(tableId, recordId, context.auth.version || 3);
	},
});
