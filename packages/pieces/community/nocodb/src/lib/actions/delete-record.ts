import { nocodbAuth } from '../../';
import { createAction, Property } from '@activepieces/pieces-framework';
import { makeClient, nocodbCommon } from '../common';

export const deleteRecordAction = createAction({
	auth: nocodbAuth,
	name: 'nocodb-delete-record',
	displayName: 'Delete a Record',
	description: 'Deletes a record with the given Record ID.',
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
		return await client.deleteRecord(tableId, recordId, context.auth.version || 3);
	},
});
