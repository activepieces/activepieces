import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { mistralAuth } from '../common/auth';
import { mistralApi } from '../common/client';
import { deleteFileOutputSchema } from '../output-schemas';

export const deleteFile = createAction({
	auth: mistralAuth,
	name: 'delete_file',
	classification: 'DESTRUCTIVE',
	displayName: 'Delete File',
	description: 'Permanently delete an uploaded file.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Permanently deletes one uploaded file and its metadata by UUID; this cannot be undone and breaks any batch job or OCR call that still references it. Confirm the id with List Files or Get File first. Not idempotent: a repeat call fails because the file is gone.',
		idempotent: false,
	},
	outputSchema: deleteFileOutputSchema,
	props: {
		file_id: Property.ShortText({
			displayName: 'File ID',
			description: 'The file UUID, from List Files.',
			required: true,
		}),
	},
	async run(context) {
		const response = await mistralApi.call<{ id: string; deleted: boolean }>({
			auth: context.auth,
			method: HttpMethod.DELETE,
			path: `/files/${encodeURIComponent(context.propsValue.file_id)}`,
		});
		return { id: response.id, deleted: response.deleted };
	},
});
