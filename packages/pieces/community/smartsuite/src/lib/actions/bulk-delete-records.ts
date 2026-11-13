import { Property, createAction } from '@activepieces/pieces-framework';
import { smartsuiteAuth } from '../auth';
import { smartSuiteApi } from '../common';
import { smartSuiteClient, SmartSuiteCredentials } from '../common/client';
import { smartSuiteInputs } from '../common/inputs';
import { smartsuiteCommon } from '../common/props';
import { outputSchemas } from '../output-schemas';

const MAX_BULK = 25;

async function bulkDelete({ credentials, tableId, recordIds }: { credentials: SmartSuiteCredentials; tableId: unknown; recordIds: unknown }): Promise<{ deletedIds: string[]; count: number }> {
	const ids = smartSuiteInputs.requireIdList({ value: recordIds, label: 'Record IDs', max: MAX_BULK });
	const deletedIds = await smartSuiteApi.trashRecords({ credentials, tableId, recordIds: ids });
	return { deletedIds, count: deletedIds.length };
}

function recordIdsProp() {
	return Property.Array({
		displayName: 'Record IDs',
		description: `Up to ${MAX_BULK} record IDs to delete.`,
		required: true,
	});
}

export const bulkDeleteRecords = createAction({
	name: 'bulk_delete_records',
	classification: 'DESTRUCTIVE',
	displayName: 'Delete Records (Bulk)',
	description: `Deletes up to ${MAX_BULK} records in one request.`,
	audience: 'human',
	aiMetadata: {
		description: 'Builder version with solution and table pickers; agents should use Delete Records (Bulk, by ID). Deletes 1-25 records. Moves the records to the solution trash in a single request; they can be brought back with Restore Record. Returns the IDs SmartSuite reports as deleted. Idempotent in effect: deleting records that are already in the trash leaves them deleted.',
		idempotent: true,
	},
	auth: smartsuiteAuth,
	props: {
		solutionId: smartsuiteCommon.solutionId,
		tableId: smartsuiteCommon.tableId,
		recordIds: recordIdsProp(),
	},
	outputSchema: outputSchemas['bulkDelete'],
	async run({ auth, propsValue }) {
		return bulkDelete({ credentials: smartSuiteClient.credentialsOf(auth), tableId: propsValue.tableId, recordIds: propsValue.recordIds });
	},
});

export const bulkDeleteRecordsById = createAction({
	name: 'bulk_delete_records_by_id',
	classification: 'DESTRUCTIVE',
	displayName: 'Delete Records (Bulk, by ID)',
	description: `Deletes up to ${MAX_BULK} records in one request, by table ID.`,
	audience: 'ai',
	aiMetadata: {
		description: 'Deletes 1-25 SmartSuite records (record IDs from List Records) from one table (Table ID from List Tables (by ID)). Moves the records to the solution trash in a single request; they can be brought back with Restore Record. Returns the IDs SmartSuite reports as deleted. Idempotent in effect: deleting records that are already in the trash leaves them deleted. To undo, use List Deleted Records (by ID) then Restore Record (by ID).',
		idempotent: true,
	},
	auth: smartsuiteAuth,
	props: {
		tableId: smartSuiteInputs.aiProps.tableId(),
		recordIds: recordIdsProp(),
	},
	outputSchema: outputSchemas['bulkDelete'],
	async run({ auth, propsValue }) {
		return bulkDelete({ credentials: smartSuiteClient.credentialsOf(auth), tableId: propsValue.tableId, recordIds: propsValue.recordIds });
	},
});
