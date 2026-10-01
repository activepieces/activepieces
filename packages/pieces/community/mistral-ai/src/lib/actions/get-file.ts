import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { mistralAuth } from '../common/auth';
import { mistralApi } from '../common/client';
import { fileUtils, MistralFile } from '../common/files';
import { fileOutputSchema } from '../output-schemas';

export const getFile = createAction({
	auth: mistralAuth,
	name: 'get_file',
	classification: 'READ',
	displayName: 'Get File',
	description: 'Get the details of an uploaded file.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Returns the metadata of one uploaded file by UUID: name, purpose, size, MIME type, source and creation time. It does not return the content; use Download File for that. Get file ids from List Files or Upload File. Read-only; safe to retry.',
		idempotent: true,
	},
	outputSchema: fileOutputSchema,
	props: {
		file_id: Property.ShortText({
			displayName: 'File ID',
			description: 'The file UUID, from List Files or Upload File.',
			required: true,
		}),
	},
	async run(context) {
		const file = await mistralApi.call<MistralFile>({
			auth: context.auth,
			method: HttpMethod.GET,
			path: `/files/${encodeURIComponent(context.propsValue.file_id)}`,
		});
		return fileUtils.formatFile(file);
	},
});
