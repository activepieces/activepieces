import FormData from 'form-data';
import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { attioAuth } from '../../auth';
import { attioApiCall } from '../../common/client';
import { attioAi } from '../../common/ai';
import { attioGetFileOutputSchema } from '../../output-schemas';

export const attioUploadFileAction = createAction({
	auth: attioAuth,
	name: 'attio_upload_file',
	outputSchema: attioGetFileOutputSchema,
	displayName: 'Upload File',
	description: 'Uploads a file to a record.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description: 'Uploads a file to the native files of a record, optionally into a folder. Not idempotent.',
		idempotent: false,
	},
	props: {
		object: attioAi.objectProp(),
		record_id: attioAi.recordIdProp({ description: 'ID of the record the files belong to.' }),
		file: Property.File({ displayName: 'File', required: true }),
		parent_folder_id: Property.ShortText({ displayName: 'Parent Folder ID', description: 'Folder to put it in; empty for the root.', required: false }),
	},
	async run(context) {
		const { object, record_id, file, parent_folder_id } = context.propsValue;
		const form = new FormData();
		form.append('file', file.data, file.filename);
		form.append('object', object);
		form.append('record_id', record_id);
		if (parent_folder_id) {
			form.append('parent_folder_id', parent_folder_id);
		}
		const response = await attioApiCall<{ data: Record<string, unknown> }>({
			accessToken: context.auth.secret_text,
			method: HttpMethod.POST,
			resourceUri: `/files/upload`,
			body: form,
			headers: form.getHeaders(),
		});
		return response.data;
	},
});
