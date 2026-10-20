import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { smartsuiteAuth } from '../auth';
import { smartSuitePaginatedApiCall } from '../common';
import { SmartSuiteCredentials } from '../common/client';
import { smartSuiteInputs } from '../common/inputs';
import { smartsuiteCommon } from '../common/props';
import { outputSchemas } from '../output-schemas';

async function listForRecord({ credentials, recordId }: { credentials: SmartSuiteCredentials; recordId: unknown }) {
	const record = smartSuiteInputs.requireText({ value: recordId, label: 'Record ID' });
	const items = await smartSuitePaginatedApiCall<Record<string, unknown>>({
		apiKey: credentials.apiKey,
		accountId: credentials.accountId,
		method: HttpMethod.GET,
		resourceUri: '/comments/',
		query: { record },
		operation: 'list comments',
	});
	return { items, count: items.length };
}

export const listComments = createAction({
	name: 'list_comments',
	classification: 'SEARCH',
	displayName: 'List Comments',
	description: 'Lists the comments on a record.',
	audience: 'human',
	aiMetadata: {
		description: 'Builder version with solution, table and record pickers; agents should use List Comments (by ID). Returns every comment on the record (author member ID, created time, message HTML and text). Read-only and idempotent.',
		idempotent: true,
	},
	auth: smartsuiteAuth,
	props: {
		solutionId: smartsuiteCommon.solutionId,
		tableId: smartsuiteCommon.tableId,
		recordId: smartsuiteCommon.recordDropdown({ displayName: 'Record' }),
	},
	outputSchema: outputSchemas['commentList'],
	async run({ auth, propsValue }) {
		return listForRecord({ credentials: auth.props, recordId: propsValue.recordId });
	},
});

export const listCommentsById = createAction({
	name: 'list_comments_by_id',
	classification: 'SEARCH',
	displayName: 'List Comments (by ID)',
	description: 'Lists the comments on a record, by record ID.',
	audience: 'ai',
	aiMetadata: {
		description: 'Returns every comment on one SmartSuite record (author member ID, created time, message HTML and text). Needs the Record ID from List Records or Get Record (by ID). Resolve author IDs with Get Member (by ID); reply with Add Comment (by ID). Read-only and idempotent.',
		idempotent: true,
	},
	auth: smartsuiteAuth,
	props: {
		recordId: smartSuiteInputs.aiProps.recordId(),
	},
	outputSchema: outputSchemas['commentList'],
	async run({ auth, propsValue }) {
		return listForRecord({ credentials: auth.props, recordId: propsValue.recordId });
	},
});
