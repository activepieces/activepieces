import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { SoftrAuth } from '../common/auth';
import { softrClient } from '../common/client';
import { softrAdmin } from '../common/admin';
import { databaseIdDropdown, tableIdDropdown } from '../common/props';
import { SoftrListResponse, SoftrTableView } from '../common/types';
import { softrOutputSchemas } from '../output-schemas';

export const listTableViews = createAction({
	auth: SoftrAuth,
	name: 'listTableViews',
	classification: 'SEARCH',
	displayName: 'List Table Views',
	description: 'Lists the views of a Softr table.',
	audience: 'both',
	aiMetadata: {
		description:
			'Lists the views of a Softr table, with view IDs and names. Read-only.',
		idempotent: true,
	},
	props: {
		databaseId: databaseIdDropdown,
		tableId: tableIdDropdown,
	},
	outputSchema: softrOutputSchemas.tableViews,
	async run({ auth, propsValue }) {
		const databaseId = softrAdmin.requireId({ value: propsValue.databaseId, label: 'Database ID' });
		const tableId = softrAdmin.requireId({ value: propsValue.tableId, label: 'Table ID' });
		const response = await softrClient.request<SoftrListResponse<SoftrTableView>>({
			apiKey: auth.secret_text,
			method: HttpMethod.GET,
			path: `${softrClient.tablePath({ databaseId, tableId })}/views`,
		});
		const views = response.data ?? [];
		return { count: views.length, views };
	},
});
