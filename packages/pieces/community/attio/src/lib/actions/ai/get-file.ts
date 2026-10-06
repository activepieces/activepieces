import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { attioAuth } from '../../auth';
import { attioApiCall } from '../../common/client';
import { attioGetFileOutputSchema } from '../../output-schemas';

export const attioGetFileAction = createAction({
	auth: attioAuth,
	name: 'attio_get_file',
	outputSchema: attioGetFileOutputSchema,
	displayName: 'Get File',
	description: 'Gets a file or folder entry by its ID.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description: 'Gets metadata of one file or folder. Use Download File for the content.',
		idempotent: true,
	},
	props: {
		file_id: Property.ShortText({ displayName: 'File ID', description: 'From List Files.', required: true }),
	},
	async run(context) {
		const { file_id } = context.propsValue;
		const response = await attioApiCall<{ data: Record<string, unknown> }>({
			accessToken: context.auth.secret_text,
			method: HttpMethod.GET,
			resourceUri: `/files/${file_id}`,
		});
		return response.data;
	},
});
