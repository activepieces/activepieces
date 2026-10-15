import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { smartsuiteAuth } from '../auth';
import { SmartSuiteTable } from '../common';
import { smartSuiteClient, SmartSuiteCredentials } from '../common/client';
import { smartSuiteInputs } from '../common/inputs';
import { smartsuiteCommon } from '../common/props';
import { tableSummary } from '../common/tables';
import { outputSchemas } from '../output-schemas';

async function create({ credentials, solutionId, name }: { credentials: SmartSuiteCredentials; solutionId: unknown; name: unknown }) {
	const solution = smartSuiteInputs.requireText({ value: solutionId, label: 'Solution' });
	const tableName = smartSuiteInputs.requireText({ value: name, label: 'Table Name' });
	const table = await smartSuiteClient.request<SmartSuiteTable>({
		credentials,
		method: HttpMethod.POST,
		path: '/applications/',
		body: { name: tableName, solution, structure: [] },
		operation: 'create table',
	});
	return {
		...tableSummary.summarize(table),
		fields: (table.structure ?? []).map((field) => tableSummary.describeField(field)),
	};
}

function nameProp() {
	return Property.ShortText({
		displayName: 'Table Name',
		required: true,
	});
}

export const createTable = createAction({
	name: 'create_table',
	classification: 'WRITE',
	displayName: 'Create Table',
	description: 'Creates a new table in a solution.',
	audience: 'human',
	aiMetadata: {
		description: 'Builder version with a solution picker; agents should use Create Table (by ID). SmartSuite adds its default fields (Title, Description, Assigned To, Status, Due Date, Priority and system fields). Needs permission to change the solution. Returns the table and its fields. Not idempotent: each call creates another table.',
		idempotent: false,
	},
	auth: smartsuiteAuth,
	props: {
		solutionId: smartsuiteCommon.solutionId,
		name: nameProp(),
	},
	outputSchema: outputSchemas['tableSchema'],
	async run({ auth, propsValue }) {
		return create({ credentials: smartSuiteClient.credentialsOf(auth), solutionId: propsValue.solutionId, name: propsValue.name });
	},
});

export const createTableById = createAction({
	name: 'create_table_by_id',
	classification: 'WRITE',
	displayName: 'Create Table (by ID)',
	description: 'Creates a new table in a solution, by solution ID.',
	audience: 'ai',
	aiMetadata: {
		description: 'Creates a new SmartSuite table (application) in a solution (Solution ID from List Solutions). SmartSuite adds its default fields (Title, Description, Assigned To, Status, Due Date, Priority and system fields). Needs permission to change the solution. Returns the table and its fields. Not idempotent: each call creates another table. Check List Tables (by ID) first to avoid a duplicate name. Next: Add Field (by ID) with the returned id.',
		idempotent: false,
	},
	auth: smartsuiteAuth,
	props: {
		solutionId: smartSuiteInputs.aiProps.solutionId(),
		name: nameProp(),
	},
	outputSchema: outputSchemas['tableSchema'],
	async run({ auth, propsValue }) {
		return create({ credentials: smartSuiteClient.credentialsOf(auth), solutionId: propsValue.solutionId, name: propsValue.name });
	},
});
