import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { SoftrAuth } from '../common/auth';
import { softrClient } from '../common/client';
import { softrAdmin } from '../common/admin';
import { SoftrDatabase, SoftrSingleResponse } from '../common/types';
import { softrOutputSchemas } from '../output-schemas';

export const createDatabase = createAction({
	auth: SoftrAuth,
	name: 'createDatabase',
	classification: 'WRITE',
	displayName: 'Create Database',
	description: 'Creates a new database in a Softr workspace.',
	audience: 'both',
	aiMetadata: {
		description:
			'Creates a new, empty Softr database and returns its ID. Needs the workspace ID, which the user copies from the Softr Studio URL (no API can look it up). Add tables next with Create Table. Each call creates another database.',
		idempotent: false,
	},
	props: {
		workspaceId: Property.ShortText({
			displayName: 'Workspace ID',
			description: 'Copy it from the Softr Studio URL, after /workspaces/.',
			required: true,
		}),
		name: Property.ShortText({
			displayName: 'Name',
			required: true,
		}),
		description: Property.LongText({
			displayName: 'Description',
			required: false,
		}),
	},
	outputSchema: softrOutputSchemas.database,
	async run({ auth, propsValue }) {
		const workspaceId = softrAdmin.requireId({ value: propsValue.workspaceId, label: 'Workspace ID' });
		const name = softrAdmin.requireId({ value: propsValue.name, label: 'Name' });
		const description = softrAdmin.optionalText(propsValue.description);
		const response = await softrClient.request<SoftrSingleResponse<SoftrDatabase>>({
			apiKey: auth.secret_text,
			method: HttpMethod.POST,
			path: '/databases',
			body: { workspaceId, name, ...(description !== undefined ? { description } : {}) },
		});
		return response.data;
	},
});
