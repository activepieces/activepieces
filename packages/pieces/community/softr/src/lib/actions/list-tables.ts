import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { SoftrAuth } from '../common/auth';
import { softrClient } from '../common/client';
import { databaseIdDropdown } from '../common/props';
import { SoftrListResponse, SoftrTable } from '../common/types';
import { softrOutputSchemas } from '../output-schemas';

export const listTables = createAction({
	auth: SoftrAuth,
	name: 'listTables',
	classification: 'SEARCH',
	displayName: 'List Tables',
	description: 'Lists the tables in a Softr database, including their fields.',
	audience: 'human',
	aiMetadata: {
		description:
			'Lists the tables in a Softr database with their IDs, names and columns. Agents: Get Database Schema (Agent) returns the same in a simpler shape, with select options. Read-only.',
		idempotent: true,
	},
	props: {
		databaseId: databaseIdDropdown,
	},
	outputSchema: softrOutputSchemas.listTables,
	async run({ auth, propsValue }) {
		const response = await softrClient.request<SoftrListResponse<SoftrTable>>({
			apiKey: auth.secret_text,
			method: HttpMethod.GET,
			path: `/databases/${encodeURIComponent(propsValue.databaseId)}/tables`,
		});
		const tables = response.data ?? [];
		return { count: tables.length, tables };
	},
});
