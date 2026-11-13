import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { SoftrAuth } from '../common/auth';
import { softrClient } from '../common/client';
import { softrAdmin } from '../common/admin';
import { databaseIdDropdown } from '../common/props';
import { SoftrDatabase, SoftrSingleResponse } from '../common/types';
import { softrOutputSchemas } from '../output-schemas';

export const getDatabase = createAction({
	auth: SoftrAuth,
	name: 'getDatabase',
	classification: 'READ',
	displayName: 'Get Database',
	description: 'Retrieves a Softr database by its ID.',
	audience: 'both',
	aiMetadata: {
		description:
			'Gets one Softr database by ID: name, description, workspace ID and table count. Use List Databases to find the ID. Read-only.',
		idempotent: true,
	},
	props: {
		databaseId: databaseIdDropdown,
	},
	outputSchema: softrOutputSchemas.database,
	async run({ auth, propsValue }) {
		const databaseId = softrAdmin.requireId({ value: propsValue.databaseId, label: 'Database ID' });
		const response = await softrClient.request<SoftrSingleResponse<SoftrDatabase>>({
			apiKey: auth.secret_text,
			method: HttpMethod.GET,
			path: softrClient.databasePath({ databaseId }),
		});
		return response.data;
	},
});
