import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { smartsuiteAuth } from '../auth';
import { SmartSuiteRecord } from '../common';
import { smartSuiteClient, SmartSuiteCredentials } from '../common/client';
import { smartSuiteInputs } from '../common/inputs';
import { smartsuiteCommon } from '../common/props';
import { outputSchemas } from '../output-schemas';

const MAX_BULK = 25;

async function bulkUpdate({ credentials, tableId, records }: { credentials: SmartSuiteCredentials; tableId: unknown; records: unknown }): Promise<{ items: SmartSuiteRecord[]; count: number }> {
	const items = smartSuiteInputs.requireObjectArray({ value: records, label: 'Records', max: MAX_BULK });
	items.forEach((record, index) => {
		if (typeof record['id'] !== 'string' || record['id'].trim().length === 0) {
			throw new Error(`Records item ${index + 1} needs an "id" with the record ID to update.`);
		}
		if (Object.keys(record).length < 2) {
			throw new Error(`Records item ${index + 1} has no fields to update.`);
		}
	});
	const updated = await smartSuiteClient.request<SmartSuiteRecord[]>({
		credentials,
		method: HttpMethod.PATCH,
		path: `/applications/${smartSuiteClient.pathSegment({ value: tableId, label: 'Table' })}/records/bulk/`,
		body: { items },
		operation: 'bulk update records',
	});
	const list = Array.isArray(updated) ? updated : [];
	return { items: list, count: list.length };
}

function recordsProp() {
	return Property.Json({
		displayName: 'Records',
		description: `JSON array of up to ${MAX_BULK} objects, each with "id" and the field slugs to change, for example [{"id":"64f...","status":{"value":"complete"}}].`,
		required: true,
	});
}

export const bulkUpdateRecords = createAction({
	name: 'bulk_update_records',
	classification: 'WRITE',
	displayName: 'Update Records (Bulk)',
	description: `Updates up to ${MAX_BULK} records in one request.`,
	audience: 'human',
	aiMetadata: {
		description: 'Builder version with solution and table pickers; agents should use Update Records (Bulk, by ID). Updates 1-25 records. Each item has "id" plus the field slugs to change; omitted fields keep their value. Returns the updated records. Idempotent: sending the same values again leaves the records unchanged.',
		idempotent: true,
	},
	auth: smartsuiteAuth,
	props: {
		solutionId: smartsuiteCommon.solutionId,
		tableId: smartsuiteCommon.tableId,
		records: recordsProp(),
	},
	outputSchema: outputSchemas['bulkRecords'],
	async run({ auth, propsValue }) {
		return bulkUpdate({ credentials: smartSuiteClient.credentialsOf(auth), tableId: propsValue.tableId, records: propsValue.records });
	},
});

export const bulkUpdateRecordsById = createAction({
	name: 'bulk_update_records_by_id',
	classification: 'WRITE',
	displayName: 'Update Records (Bulk, by ID)',
	description: `Updates up to ${MAX_BULK} records in one request, by table ID.`,
	audience: 'ai',
	aiMetadata: {
		description: 'Updates 1-25 SmartSuite records in one table (Table ID from List Tables (by ID)) with a single request. Get record ids from List Records and slugs from Get Table Schema (by ID). Each item has "id" plus the field slugs to change; omitted fields keep their value. Returns the updated records. Idempotent: sending the same values again leaves the records unchanged.',
		idempotent: true,
	},
	auth: smartsuiteAuth,
	props: {
		tableId: smartSuiteInputs.aiProps.tableId(),
		records: recordsProp(),
	},
	outputSchema: outputSchemas['bulkRecords'],
	async run({ auth, propsValue }) {
		return bulkUpdate({ credentials: smartSuiteClient.credentialsOf(auth), tableId: propsValue.tableId, records: propsValue.records });
	},
});
