import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { smartsuiteAuth } from '../auth';
import { smartSuiteApi, SmartSuiteRecord } from '../common';
import { smartSuiteClient, SmartSuiteCredentials } from '../common/client';
import { smartSuiteInputs } from '../common/inputs';
import { formatRecordFields, smartsuiteCommon } from '../common/props';
import { outputSchemas } from '../output-schemas';

async function upsert({
	credentials,
	tableId,
	matchField,
	matchValue,
	createMatchValue,
	fields,
}: {
	credentials: SmartSuiteCredentials;
	tableId: unknown;
	matchField: string;
	matchValue: string;
	createMatchValue: unknown;
	fields: Record<string, unknown>;
}): Promise<{ action: 'created' | 'updated'; record: SmartSuiteRecord }> {
	const tableSegment = smartSuiteClient.pathSegment({ value: tableId, label: 'Table' });
	const matches = await smartSuiteApi.listRecordsPage({
		credentials,
		tableId,
		filter: { operator: 'and', fields: [{ field: matchField, comparison: 'is', value: matchValue }] },
		limit: 2,
		offset: 0,
	});
	if (matches.items.length > 1) {
		throw new Error(`More than one record has ${matchField} = "${matchValue}", so nothing was changed. Use a field with unique values.`);
	}
	const existing = matches.items[0];
	if (existing && typeof existing['id'] === 'string') {
		const record = await smartSuiteClient.request<SmartSuiteRecord>({
			credentials,
			method: HttpMethod.PATCH,
			path: `/applications/${tableSegment}/records/${smartSuiteClient.pathSegment({ value: existing['id'], label: 'Record ID' })}/`,
			body: fields,
			operation: 'update record',
		});
		return { action: 'updated', record };
	}
	const record = await smartSuiteClient.request<SmartSuiteRecord>({
		credentials,
		method: HttpMethod.POST,
		path: `/applications/${tableSegment}/records/`,
		body: { [matchField]: createMatchValue, ...fields },
		operation: 'create record',
	});
	return { action: 'created', record };
}

export const upsertRecord = createAction({
	name: 'upsert_record',
	classification: 'WRITE',
	displayName: 'Create or Update Record',
	description: 'Updates the record whose field matches a value, or creates it when none matches.',
	audience: 'human',
	aiMetadata: {
		description: 'Builder version with solution, table and field pickers; agents should use Create or Update Record (by ID). One match: patches it. No match: creates a record with the match value (formatted for the field type, for example an array for email fields) plus the fields. More than one match: fails without changing anything. Not atomic: two runs at the same moment can both create. Idempotent for sequential runs with the same input.',
		idempotent: true,
	},
	auth: smartsuiteAuth,
	props: {
		solutionId: smartsuiteCommon.solutionId,
		tableId: smartsuiteCommon.tableId,
		matchField: smartsuiteCommon.tableFieldDropdown({
			displayName: 'Match Field',
			description: 'The field that identifies the record, for example an email or external ID field.',
			required: true,
		}),
		matchValue: Property.ShortText({
			displayName: 'Match Value',
			required: true,
		}),
		fields: smartsuiteCommon.tableFields,
	},
	outputSchema: outputSchemas['upsertRecord'],
	async run({ auth, propsValue }) {
		const matchField = smartSuiteInputs.requireText({ value: propsValue.matchField, label: 'Match Field' });
		const matchValue = smartSuiteInputs.requireText({ value: propsValue.matchValue, label: 'Match Value' });
		const credentials = smartSuiteClient.credentialsOf(auth);
		const table = await smartSuiteApi.getTable({ credentials, tableId: propsValue.tableId });
		const fields = formatRecordFields({ tableSchema: table.structure, tableValues: propsValue.fields ?? {} });
		const formattedMatch = formatRecordFields({ tableSchema: table.structure, tableValues: { [matchField]: matchValue } });
		const createMatchValue = matchField in formattedMatch ? formattedMatch[matchField] : matchValue;
		return upsert({ credentials, tableId: propsValue.tableId, matchField, matchValue, createMatchValue, fields });
	},
});

export const upsertRecordById = createAction({
	name: 'upsert_record_by_id',
	classification: 'WRITE',
	displayName: 'Create or Update Record (by ID)',
	description: 'Updates the record whose field matches a value, or creates it when none matches, by table ID and field slug.',
	audience: 'ai',
	aiMetadata: {
		description: 'Looks for a record in the table (Table ID from List Tables) whose Match Field (slug from Get Table Schema (by ID)) equals Match Value. One match: patches it. No match: creates a record with the match value plus the fields. More than one match: fails without changing anything. Not atomic: two runs at the same moment can both create. Idempotent for sequential runs with the same input. If the match field needs another value format, such as an array for email fields, put it in Fields too; Fields wins. Returns action (created/updated) and the record; use its id with Get Record (by ID) or Add Comment (by ID).',
		idempotent: true,
	},
	auth: smartsuiteAuth,
	props: {
		tableId: smartSuiteInputs.aiProps.tableId(),
		matchField: Property.ShortText({
			displayName: 'Match Field Slug',
			description: 'Slug of the field that identifies the record, for example an email or external ID field. Get slugs from Get Table Schema (by ID).',
			required: true,
		}),
		matchValue: Property.ShortText({
			displayName: 'Match Value',
			required: true,
		}),
		fields: Property.Json({
			displayName: 'Fields',
			description: 'JSON object keyed by field slug with the values to set, for example {"status":{"value":"complete"}}.',
			required: true,
		}),
	},
	outputSchema: outputSchemas['upsertRecord'],
	async run({ auth, propsValue }) {
		const matchField = smartSuiteInputs.requireText({ value: propsValue.matchField, label: 'Match Field' });
		const matchValue = smartSuiteInputs.requireText({ value: propsValue.matchValue, label: 'Match Value' });
		const fields = smartSuiteInputs.requireObject({ value: propsValue.fields, label: 'Fields' });
		return upsert({ credentials: smartSuiteClient.credentialsOf(auth), tableId: propsValue.tableId, matchField, matchValue, createMatchValue: matchValue, fields });
	},
});
