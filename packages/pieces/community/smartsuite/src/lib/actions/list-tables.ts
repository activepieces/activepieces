import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { smartsuiteAuth } from '../auth';
import { smartSuitePaginatedApiCall, SmartSuiteTable } from '../common';
import { SmartSuiteCredentials } from '../common/client';
import { smartSuiteInputs } from '../common/inputs';
import { smartsuiteCommon } from '../common/props';
import { tableSummary } from '../common/tables';
import { outputSchemas } from '../output-schemas';

async function listForSolution({ credentials, solutionId }: { credentials: SmartSuiteCredentials; solutionId: unknown }) {
	const id = smartSuiteInputs.requireText({ value: solutionId, label: 'Solution' });
	const tables = await smartSuitePaginatedApiCall<SmartSuiteTable>({
		apiKey: credentials.apiKey,
		accountId: credentials.accountId,
		method: HttpMethod.GET,
		resourceUri: '/applications/',
		query: { solution: id },
		operation: 'list tables',
	});
	const items = tables.map((table) => tableSummary.summarize(table));
	return { items, count: items.length };
}

export const listTables = createAction({
	name: 'list_tables',
	classification: 'SEARCH',
	displayName: 'List Tables',
	description: 'Lists the tables in a solution.',
	audience: 'human',
	aiMetadata: {
		description: 'Builder version with a solution picker; agents should use List Tables (by ID). Returns the tables of the solution with ID, name, slug and field count. Read-only and idempotent.',
		idempotent: true,
	},
	auth: smartsuiteAuth,
	props: {
		solutionId: smartsuiteCommon.solutionId,
	},
	outputSchema: outputSchemas['tableList'],
	async run({ auth, propsValue }) {
		return listForSolution({ credentials: auth.props, solutionId: propsValue.solutionId });
	},
});

export const listTablesById = createAction({
	name: 'list_tables_by_id',
	classification: 'SEARCH',
	displayName: 'List Tables (by ID)',
	description: 'Lists the tables in a solution, by solution ID.',
	audience: 'ai',
	aiMetadata: {
		description: 'Returns the tables (SmartSuite calls them applications) in one solution, with ID, name, slug and field count. Needs a Solution ID from List Solutions. Next: Get Table Schema (by ID) to learn the field slugs before reading or writing records. Read-only and idempotent.',
		idempotent: true,
	},
	auth: smartsuiteAuth,
	props: {
		solutionId: smartSuiteInputs.aiProps.solutionId(),
	},
	outputSchema: outputSchemas['tableList'],
	async run({ auth, propsValue }) {
		return listForSolution({ credentials: auth.props, solutionId: propsValue.solutionId });
	},
});
