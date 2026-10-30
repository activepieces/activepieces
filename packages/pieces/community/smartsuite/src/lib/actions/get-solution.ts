import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { smartsuiteAuth } from '../auth';
import { smartSuiteClient, SmartSuiteCredentials } from '../common/client';
import { smartSuiteInputs } from '../common/inputs';
import { smartsuiteCommon } from '../common/props';
import { outputSchemas } from '../output-schemas';

async function getOne({ credentials, solutionId }: { credentials: SmartSuiteCredentials; solutionId: unknown }): Promise<Record<string, unknown>> {
	return smartSuiteClient.request<Record<string, unknown>>({
		credentials,
		method: HttpMethod.GET,
		path: `/solutions/${smartSuiteClient.pathSegment({ value: solutionId, label: 'Solution' })}/`,
		operation: 'get solution',
	});
}

export const getSolution = createAction({
	name: 'get_solution',
	classification: 'READ',
	displayName: 'Get Solution',
	description: 'Gets the details of one solution.',
	audience: 'human',
	aiMetadata: {
		description: 'Builder version with a solution picker; agents should use Get Solution (by ID). Returns the solution name, status, permissions and counts. Read-only and idempotent.',
		idempotent: true,
	},
	auth: smartsuiteAuth,
	props: {
		solutionId: smartsuiteCommon.solutionId,
	},
	outputSchema: outputSchemas['solution'],
	async run({ auth, propsValue }) {
		return getOne({ credentials: smartSuiteClient.credentialsOf(auth), solutionId: propsValue.solutionId });
	},
});

export const getSolutionById = createAction({
	name: 'get_solution_by_id',
	classification: 'READ',
	displayName: 'Get Solution (by ID)',
	description: 'Gets the details of one solution, by solution ID.',
	audience: 'ai',
	aiMetadata: {
		description: 'Returns one SmartSuite solution by its Solution ID from List Solutions (name, status, permissions, counts). Next: List Tables (by ID) for its tables. Read-only and idempotent.',
		idempotent: true,
	},
	auth: smartsuiteAuth,
	props: {
		solutionId: smartSuiteInputs.aiProps.solutionId(),
	},
	outputSchema: outputSchemas['solution'],
	async run({ auth, propsValue }) {
		return getOne({ credentials: smartSuiteClient.credentialsOf(auth), solutionId: propsValue.solutionId });
	},
});
