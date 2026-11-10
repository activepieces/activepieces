import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { SoftrAuth } from '../common/auth';
import { softrClient } from '../common/client';
import { softrAdmin } from '../common/admin';
import { databaseIdDropdown, tableIdDropdown } from '../common/props';

export const deleteTable = createAction({
	auth: SoftrAuth,
	name: 'deleteTable',
	classification: 'DESTRUCTIVE',
	displayName: 'Delete Table',
	description: 'Permanently deletes a Softr table.',
	audience: 'both',
	aiMetadata: {
		description:
			'Permanently deletes a Softr table. With Force Delete it also deletes all its records; without it, Softr refuses while the table still has records. Only use when the user clearly asked for it: this cannot be undone.',
		idempotent: false,
	},
	props: {
		databaseId: databaseIdDropdown,
		tableId: tableIdDropdown,
		force: Property.Checkbox({
			displayName: 'Force Delete (deletes all records)',
			description: 'Without this, Softr only deletes an empty table.',
			required: false,
			defaultValue: false,
		}),
	},
	async run({ auth, propsValue }) {
		const databaseId = softrAdmin.requireId({ value: propsValue.databaseId, label: 'Database ID' });
		const tableId = softrAdmin.requireId({ value: propsValue.tableId, label: 'Table ID' });
		const force = propsValue.force === true;
		await softrClient.request({
			apiKey: auth.secret_text,
			method: HttpMethod.DELETE,
			path: softrClient.tablePath({ databaseId, tableId }),
			queryParams: force ? { force: 'true' } : undefined,
		});
		return { success: true, tableId, force };
	},
});
