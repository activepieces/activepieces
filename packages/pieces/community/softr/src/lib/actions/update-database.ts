import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { SoftrAuth } from '../common/auth';
import { softrClient } from '../common/client';
import { softrAdmin } from '../common/admin';
import { databaseIdDropdown } from '../common/props';
import { SoftrDatabase, SoftrSingleResponse } from '../common/types';
import { softrOutputSchemas } from '../output-schemas';

export const updateDatabase = createAction({
	auth: SoftrAuth,
	name: 'updateDatabase',
	classification: 'WRITE',
	displayName: 'Update Database',
	description: 'Renames a Softr database or changes its description.',
	audience: 'both',
	aiMetadata: {
		description:
			'Renames a Softr database and/or changes its description. Only the values you give change; the API cannot clear a description. Safe to retry.',
		idempotent: true,
	},
	props: {
		databaseId: databaseIdDropdown,
		name: Property.ShortText({
			displayName: 'New Name',
			description: 'Leave empty to keep the current name.',
			required: false,
		}),
		description: Property.LongText({
			displayName: 'New Description',
			description: 'Leave empty to keep the current description.',
			required: false,
		}),
	},
	outputSchema: softrOutputSchemas.database,
	async run({ auth, propsValue }) {
		const databaseId = softrAdmin.requireId({ value: propsValue.databaseId, label: 'Database ID' });
		const body = softrAdmin.buildNameDescriptionUpdate({
			name: propsValue.name,
			description: propsValue.description,
			clearDescription: false,
		});
		const response = await softrClient.request<SoftrSingleResponse<SoftrDatabase>>({
			apiKey: auth.secret_text,
			method: HttpMethod.PUT,
			path: softrClient.databasePath({ databaseId }),
			body,
		});
		return response.data;
	},
});
