import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { attioAuth } from '../../auth';
import { attioApiCall } from '../../common/client';
import { attioDownloadFileOutputSchema } from '../../output-schemas';

export const attioDownloadFileAction = createAction({
	auth: attioAuth,
	name: 'attio_download_file',
	outputSchema: attioDownloadFileOutputSchema,
	displayName: 'Download File',
	description: 'Downloads a file stored in Attio.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description: 'Downloads a native Attio file and returns it as a file reference with its name and type. Folders and connected files cannot be downloaded.',
		idempotent: true,
	},
	props: {
		file_id: Property.ShortText({ displayName: 'File ID', description: 'From List Files.', required: true }),
	},
	async run(context) {
		const { file_id } = context.propsValue;
		const meta = await attioApiCall<{ data: { name?: string; content_type?: string; content_size?: number } }>({
			accessToken: context.auth.secret_text,
			method: HttpMethod.GET,
			resourceUri: `/files/${file_id}`,
		});
		const content = await attioApiCall<ArrayBuffer>({
			accessToken: context.auth.secret_text,
			method: HttpMethod.GET,
			resourceUri: `/files/${file_id}/download`,
			responseType: 'arraybuffer',
		});
		const fileName = meta.data.name ?? file_id;
		const file = await context.files.write({ fileName, data: Buffer.from(content) });
		return { file, name: fileName, content_type: meta.data.content_type ?? null, content_size: meta.data.content_size ?? null };
	},
});
