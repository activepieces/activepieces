import { createAction } from '@activepieces/pieces-framework';
import { smartsuiteAuth } from '../auth';
import { smartSuiteClient } from '../common/client';
import { smartSuiteInputs } from '../common/inputs';
import { outputSchemas } from '../output-schemas';
import { pagedList } from '../common/paged-list';

export const listMembers = createAction({
	name: 'list_members',
	classification: 'SEARCH',
	displayName: 'List Members',
	description: 'Lists the members of your SmartSuite workspace.',
	audience: 'both',
	aiMetadata: {
		description: 'Returns one page of SmartSuite workspace members (member ID, full name, emails, role, job title). Use member IDs for user fields and comment assignment. Page with offset. Read-only and idempotent.',
		idempotent: true,
	},
	auth: smartsuiteAuth,
	props: {
		limit: smartSuiteInputs.aiProps.limit(100),
		offset: smartSuiteInputs.aiProps.offset(),
	},
	outputSchema: outputSchemas['memberPage'],
	async run({ auth, propsValue }) {
		return pagedList.fetch({
			credentials: smartSuiteClient.credentialsOf(auth),
			path: '/applications/members/records/list/',
			limit: propsValue.limit,
			offset: propsValue.offset,
			operation: 'list members',
		});
	},
});
