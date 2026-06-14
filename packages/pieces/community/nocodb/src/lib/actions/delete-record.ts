import { nocodbAuth } from '../auth';
import { createAction, Property } from '@activepieces/pieces-framework';
import { makeClient, nocodbCommon } from '../common';

export const deleteRecordAction = createAction({
	auth: nocodbAuth,
	name: 'nocodb-delete-record',
	displayName: 'Delete a Record',
	description: 'Deletes a record with the given Record ID.',
	audience: 'both',
	aiMetadata: {
		description:
			'Permanently removes a single row from a NocoDB table, identified by its numeric Record ID within the chosen base and table. Use when an agent needs to delete a known record. Idempotent: repeating the call with the same Record ID leaves the record absent and produces no additional effect.',
		idempotent: true,
	},
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
		const { baseId, tableId, recordId } = context.propsValue;

		const client = makeClient(context.auth);
		return await client.deleteRecord(baseId, tableId, recordId, context.auth.props.version || 3);
	},
});
