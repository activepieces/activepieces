import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { SoftrAuth } from '../common/auth';
import { softrClient } from '../common/client';
import { SoftrDatabase, SoftrListResponse } from '../common/types';
import { softrOutputSchemas } from '../output-schemas';

export const listDatabases = createAction({
	auth: SoftrAuth,
	name: 'listDatabases',
	classification: 'SEARCH',
	displayName: 'List Databases',
	description: 'Lists the Softr databases the API key can access.',
	audience: 'both',
	aiMetadata: {
		description:
			'Lists every Softr database the API key can access, with ID, name and table count. Call this first to get the database ID that the other actions need. Read-only.',
		idempotent: true,
	},
	props: {},
	outputSchema: softrOutputSchemas.listDatabases,
	async run({ auth }) {
		const response = await softrClient.request<SoftrListResponse<SoftrDatabase>>({
			apiKey: auth.secret_text,
			method: HttpMethod.GET,
			path: '/databases',
		});
		const databases = response.data ?? [];
		return { count: databases.length, databases };
	},
});
