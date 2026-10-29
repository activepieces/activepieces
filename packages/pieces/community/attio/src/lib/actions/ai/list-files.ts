import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { attioAuth } from '../../auth';
import { attioApiCall } from '../../common/client';
import { attioAi } from '../../common/ai';
import { attioListFilesOutputSchema } from '../../output-schemas';

export const attioListFilesAction = createAction({
	auth: attioAuth,
	name: 'attio_list_files',
	outputSchema: attioListFilesOutputSchema,
	displayName: 'List Files',
	description: 'Lists files and folders on a record.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description: 'Lists files and folders attached to a record, optionally inside one folder or from one storage provider.',
		idempotent: true,
	},
	props: {
		object: attioAi.objectProp(),
		record_id: attioAi.recordIdProp({ description: 'ID of the record the files belong to.' }),
		parent_folder_id: Property.ShortText({ displayName: 'Parent Folder ID', description: 'Only list this folder.', required: false }),
		storage_provider: Property.StaticDropdown({
			displayName: 'Storage Provider',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'Attio', value: 'attio' },
					{ label: 'Dropbox', value: 'dropbox' },
					{ label: 'Box', value: 'box' },
					{ label: 'Google Drive', value: 'google-drive' },
					{ label: 'Microsoft OneDrive', value: 'microsoft-onedrive' },
				],
			},
		}),
		limit: attioAi.limitProp({ max: 200 }),
		cursor: attioAi.cursorProp(),
	},
	async run(context) {
		const { object, record_id, parent_folder_id, storage_provider, limit, cursor } = context.propsValue;
		const response = await attioApiCall<{ data: Record<string, unknown>[]; pagination: Record<string, unknown> }>({
			accessToken: context.auth.secret_text,
			method: HttpMethod.GET,
			resourceUri: `/files`,
			query: { object, record_id, parent_folder_id, storage_provider, limit, cursor },
		});
		return { files: response.data, count: response.data.length, next_cursor: response.pagination?.['next_cursor'] ?? null };
	},
});
