import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { smartsuiteAuth } from '../auth';
import { SmartSuiteRecord } from '../common';
import { smartSuiteClient, SmartSuiteCredentials } from '../common/client';
import { smartSuiteInputs } from '../common/inputs';
import { smartsuiteCommon } from '../common/props';
import { outputSchemas } from '../output-schemas';

const MAX_BULK = 25;

async function bulkCreate({ credentials, tableId, records }: { credentials: SmartSuiteCredentials; tableId: unknown; records: unknown }): Promise<{ items: SmartSuiteRecord[]; count: number }> {
	const items = smartSuiteInputs.requireObjectArray({ value: records, label: 'Records', max: MAX_BULK });
	const created = await smartSuiteClient.request<SmartSuiteRecord[]>({
		credentials,
		method: HttpMethod.POST,
		path: `/applications/${smartSuiteClient.pathSegment({ value: tableId, label: 'Table' })}/records/bulk/`,
		body: { items },
		operation: 'bulk create records',
	});
	const list = Array.isArray(created) ? created : [];
	return { items: list, count: list.length };
}

function recordsProp() {
	return Property.Json({
		displayName: 'Records',
		description: `JSON array of up to ${MAX_BULK} objects keyed by field slug, for example [{"title":"A"},{"title":"B"}]. Use Get Table Schema to see the slugs.`,
		required: true,
	});
}

export const bulkCreateRecords = createAction({
	name: 'bulk_create_records',
	classification: 'WRITE',
	displayName: 'Create Records (Bulk)',
	description: `Creates up to ${MAX_BULK} records in one request.`,
	audience: 'human',
	aiMetadata: {
		description: 'Builder version with solution and table pickers; agents should use Create Records (Bulk, by ID). Creates 1-25 records. SmartSuite applies the batch as one request, so it fails or succeeds as a whole. Returns the created records with their ids. Not idempotent: running it again creates duplicates.',
		idempotent: false,
	},
	auth: smartsuiteAuth,
	props: {
		solutionId: smartsuiteCommon.solutionId,
		tableId: smartsuiteCommon.tableId,
		records: recordsProp(),
	},
	outputSchema: outputSchemas['bulkRecords'],
	async run({ auth, propsValue }) {
		return bulkCreate({ credentials: smartSuiteClient.credentialsOf(auth), tableId: propsValue.tableId, records: propsValue.records });
	},
});

export const bulkCreateRecordsById = createAction({
	name: 'bulk_create_records_by_id',
	classification: 'WRITE',
	displayName: 'Create Records (Bulk, by ID)',
	description: `Creates up to ${MAX_BULK} records in one request, by table ID.`,
	audience: 'ai',
	aiMetadata: {
		description: 'Creates 1-25 SmartSuite records in one table (Table ID from List Tables (by ID)) with a single request. Records is a JSON array of objects keyed by field slug; call Get Table Schema (by ID) first for slugs and choice values. SmartSuite applies the batch as one request, so it fails or succeeds as a whole. Returns the created records with their ids. Not idempotent: running it again creates duplicates. Next: Update Records (Bulk, by ID) or Get Record (by ID) with the returned ids.',
		idempotent: false,
	},
	auth: smartsuiteAuth,
	props: {
		tableId: smartSuiteInputs.aiProps.tableId(),
		records: recordsProp(),
	},
	outputSchema: outputSchemas['bulkRecords'],
	async run({ auth, propsValue }) {
		return bulkCreate({ credentials: smartSuiteClient.credentialsOf(auth), tableId: propsValue.tableId, records: propsValue.records });
	},
});
