import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { attioAuth } from '../../auth';
import { attioApiCall } from '../../common/client';
import { attioDeleteFileOutputSchema } from '../../output-schemas';

export const attioDeleteFileAction = createAction({
	auth: attioAuth,
	name: 'attio_delete_file',
	outputSchema: attioDeleteFileOutputSchema,
	displayName: 'Delete File',
	description: 'Permanently deletes a file or folder.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description: 'Permanently deletes a file or folder; deleting a folder deletes everything inside it. Cannot be undone.',
		idempotent: false,
	},
	props: {
		file_id: Property.ShortText({ displayName: 'File ID', description: 'From List Files.', required: true }),
	},
	async run(context) {
		const { file_id } = context.propsValue;
		await attioApiCall({
			accessToken: context.auth.secret_text,
			method: HttpMethod.DELETE,
			resourceUri: `/files/${file_id}`,
		});
		return { success: true, file_id };
	},
});
