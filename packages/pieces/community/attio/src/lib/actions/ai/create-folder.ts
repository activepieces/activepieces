import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { attioAuth } from '../../auth';
import { attioApiCall } from '../../common/client';
import { attioAi } from '../../common/ai';
import { attioCreateFolderOutputSchema } from '../../output-schemas';

export const attioCreateFolderAction = createAction({
	auth: attioAuth,
	name: 'attio_create_folder',
	outputSchema: attioCreateFolderOutputSchema,
	displayName: 'Create Folder',
	description: 'Creates a folder on a record.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description: 'Creates a native folder in the files of a record. Not idempotent.',
		idempotent: false,
	},
	props: {
		object: attioAi.objectProp(),
		record_id: attioAi.recordIdProp({ description: 'ID of the record the files belong to.' }),
		name: Property.ShortText({ displayName: 'Name', required: true }),
		parent_folder_id: Property.ShortText({ displayName: 'Parent Folder ID', description: 'Folder to put it in; empty for the root.', required: false }),
	},
	async run(context) {
		const { object, record_id, name, parent_folder_id } = context.propsValue;
		const response = await attioApiCall<{ data: Record<string, unknown> }>({
			accessToken: context.auth.secret_text,
			method: HttpMethod.POST,
			resourceUri: `/files`,
			body: attioAi.compact({ object, record_id, file_type: 'folder', name, parent_folder_id }),
		});
		return response.data;
	},
});
