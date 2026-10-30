import { createAction } from '@activepieces/pieces-framework';
import { smartsuiteAuth } from '../auth';
import { smartSuiteApi } from '../common';
import { smartSuiteClient, SmartSuiteCredentials } from '../common/client';
import { smartSuiteInputs } from '../common/inputs';
import { smartsuiteCommon } from '../common/props';
import { outputSchemas } from '../output-schemas';

async function listDeleted({ credentials, solutionId }: { credentials: SmartSuiteCredentials; solutionId: unknown }): Promise<{ items: Record<string, unknown>[]; count: number }> {
	const id = smartSuiteInputs.requireText({ value: solutionId, label: 'Solution' });
	const items = await smartSuiteApi.listDeletedRecords({ credentials, solutionId: id });
	return { items, count: items.length };
}

export const listDeletedRecords = createAction({
	name: 'list_deleted_records',
	classification: 'SEARCH',
	displayName: 'List Deleted Records',
	description: 'Lists the records in a solution\'s trash.',
	audience: 'human',
	aiMetadata: {
		description: 'Builder version with a solution picker; agents should use List Deleted Records (by ID). Returns the deleted records (trash) of one SmartSuite solution with record ID, title, table and deletion date. Read-only and idempotent.',
		idempotent: true,
	},
	auth: smartsuiteAuth,
	props: {
		solutionId: smartsuiteCommon.solutionId,
	},
	outputSchema: outputSchemas['deletedRecordList'],
	async run({ auth, propsValue }) {
		return listDeleted({ credentials: smartSuiteClient.credentialsOf(auth), solutionId: propsValue.solutionId });
	},
});

export const listDeletedRecordsById = createAction({
	name: 'list_deleted_records_by_id',
	classification: 'SEARCH',
	displayName: 'List Deleted Records (by ID)',
	description: 'Lists the records in a solution\'s trash, by solution ID.',
	audience: 'ai',
	aiMetadata: {
		description: 'Returns the deleted records (trash) of one SmartSuite solution with record ID, title, table and deletion date. Read-only and idempotent. Needs a Solution ID from List Solutions. Next: pass a returned id and application_id to Restore Record (by ID) to bring it back.',
		idempotent: true,
	},
	auth: smartsuiteAuth,
	props: {
		solutionId: smartSuiteInputs.aiProps.solutionId(),
	},
	outputSchema: outputSchemas['deletedRecordList'],
	async run({ auth, propsValue }) {
		return listDeleted({ credentials: smartSuiteClient.credentialsOf(auth), solutionId: propsValue.solutionId });
	},
});
