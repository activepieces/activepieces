import { createAction } from '@activepieces/pieces-framework';
import { smartsuiteAuth } from '../auth';
import { smartSuiteApi } from '../common';
import { smartSuiteClient, SmartSuiteCredentials } from '../common/client';
import { smartSuiteInputs } from '../common/inputs';
import { smartsuiteCommon } from '../common/props';
import { tableSummary } from '../common/tables';
import { outputSchemas } from '../output-schemas';

async function describeTable({ credentials, tableId }: { credentials: SmartSuiteCredentials; tableId: unknown }) {
	const table = await smartSuiteApi.getTable({ credentials, tableId });
	return {
		...tableSummary.summarize(table),
		fields: table.structure.map((field) => tableSummary.describeField(field)),
	};
}

export const getTableSchema = createAction({
	name: 'get_table_schema',
	classification: 'READ',
	displayName: 'Get Table Schema',
	description: 'Gets a table and its fields (slug, label, type and choices).',
	audience: 'human',
	aiMetadata: {
		description: 'Builder version with solution and table pickers; agents should use Get Table Schema (by ID). Returns every field of the table with slug, label, type, required/system flags and choices. Read-only and idempotent.',
		idempotent: true,
	},
	auth: smartsuiteAuth,
	props: {
		solutionId: smartsuiteCommon.solutionId,
		tableId: smartsuiteCommon.tableId,
	},
	outputSchema: outputSchemas['tableSchema'],
	async run({ auth, propsValue }) {
		return describeTable({ credentials: smartSuiteClient.credentialsOf(auth), tableId: propsValue.tableId });
	},
});

export const getTableSchemaById = createAction({
	name: 'get_table_schema_by_id',
	classification: 'READ',
	displayName: 'Get Table Schema (by ID)',
	description: 'Gets a table and its fields (slug, label, type and choices), by table ID.',
	audience: 'ai',
	aiMetadata: {
		description: 'Returns a SmartSuite table (Table ID from List Tables (by ID)) with every field: slug (the key to use in record JSON), label, type, whether it is required or system-managed, the choice values of select/status fields and the linked table of linked-record fields. Call this before List Records, Create Record (by Table ID), Update Record Fields or the bulk actions. Read-only and idempotent.',
		idempotent: true,
	},
	auth: smartsuiteAuth,
	props: {
		tableId: smartSuiteInputs.aiProps.tableId(),
	},
	outputSchema: outputSchemas['tableSchema'],
	async run({ auth, propsValue }) {
		return describeTable({ credentials: smartSuiteClient.credentialsOf(auth), tableId: propsValue.tableId });
	},
});
