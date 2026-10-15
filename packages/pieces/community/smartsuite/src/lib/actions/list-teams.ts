import { createAction } from '@activepieces/pieces-framework';
import { smartsuiteAuth } from '../auth';
import { smartSuiteClient } from '../common/client';
import { smartSuiteInputs } from '../common/inputs';
import { outputSchemas } from '../output-schemas';
import { pagedList } from '../common/paged-list';

export const listTeams = createAction({
	name: 'list_teams',
	classification: 'SEARCH',
	displayName: 'List Teams',
	description: 'Lists the teams in your SmartSuite workspace.',
	audience: 'both',
	aiMetadata: {
		description: 'Returns one page of SmartSuite teams with team ID, name, owner IDs and member IDs. Page with offset. Read-only and idempotent.',
		idempotent: true,
	},
	auth: smartsuiteAuth,
	props: {
		limit: smartSuiteInputs.aiProps.limit(100),
		offset: smartSuiteInputs.aiProps.offset(),
	},
	outputSchema: outputSchemas['teamPage'],
	async run({ auth, propsValue }) {
		return pagedList.fetch({
			credentials: smartSuiteClient.credentialsOf(auth),
			path: '/teams/list/',
			limit: propsValue.limit,
			offset: propsValue.offset,
			operation: 'list teams',
		});
	},
});
