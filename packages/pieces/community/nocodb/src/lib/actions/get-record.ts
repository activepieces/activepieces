import { nocodbAuth } from '../auth';
import { createAction, Property } from '@activepieces/pieces-framework';
import { makeClient, nocodbCommon } from '../common';

export const getRecordAction = createAction({
	auth: nocodbAuth,
	name: 'nocodb-get-record',
	displayName: 'Get a Record',
	description: 'Gets a record by the Record ID.',
	audience: 'both',
	aiMetadata: {
		description:
			'Fetches a single NocoDB row by its numeric Record ID from the chosen base and table. Use when an agent already knows the exact Record ID and needs that row\'s current field values; to find records by criteria instead, use Search Records. Idempotent read-only lookup.',
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
		return await client.getRecord(baseId, tableId, recordId, context.auth.props.version || 3);
	},
});
