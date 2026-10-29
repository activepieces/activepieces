import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { SoftrAuth } from '../common/auth';
import { softrClient } from '../common/client';
import { softrAdmin } from '../common/admin';
import { databaseIdDropdown } from '../common/props';

export const deleteDatabase = createAction({
	auth: SoftrAuth,
	name: 'deleteDatabase',
	classification: 'DESTRUCTIVE',
	displayName: 'Delete Database',
	description: 'Permanently deletes a Softr database.',
	audience: 'both',
	aiMetadata: {
		description:
			'Permanently deletes a Softr database. With Force Delete it also deletes all its tables and records; without it, Softr refuses while the database still has tables. Only use when the user clearly asked for it: this cannot be undone.',
		idempotent: false,
	},
	props: {
		databaseId: databaseIdDropdown,
		force: Property.Checkbox({
			displayName: 'Force Delete (deletes all tables and records)',
			description: 'Without this, Softr only deletes an empty database.',
			required: false,
			defaultValue: false,
		}),
	},
	async run({ auth, propsValue }) {
		const databaseId = softrAdmin.requireId({ value: propsValue.databaseId, label: 'Database ID' });
		const force = propsValue.force === true;
		await softrClient.request({
			apiKey: auth.secret_text,
			method: HttpMethod.DELETE,
			path: softrClient.databasePath({ databaseId }),
			queryParams: force ? { force: 'true' } : undefined,
		});
		return { success: true, databaseId, force };
	},
});
