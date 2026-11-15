import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { mistralAuth } from '../common/auth';
import { mistralApi } from '../common/client';
import { MistralFile } from '../common/files';
import { downloadFileOutputSchema } from '../output-schemas';

export const downloadFile = createAction({
	auth: mistralAuth,
	name: 'download_file',
	classification: 'READ',
	displayName: 'Download File',
	description: 'Download the content of an uploaded file.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Downloads the content of one Mistral file by UUID and returns it as a file the flow can pass on, together with its name and size. Use it to fetch batch results or error files (their ids come from Get Batch Job) or anything else in List Files. Read-only; safe to retry.',
		idempotent: true,
	},
	outputSchema: downloadFileOutputSchema,
	props: {
		file_id: Property.ShortText({
			displayName: 'File ID',
			description: 'The file UUID, from List Files or a batch job’s output file.',
			required: true,
		}),
	},
	async run(context) {
		const fileId = encodeURIComponent(context.propsValue.file_id);
		const metadata = await mistralApi.call<MistralFile>({
			auth: context.auth,
			method: HttpMethod.GET,
			path: `/files/${fileId}`,
		});
		const content = await mistralApi.call<ArrayBuffer>({
			auth: context.auth,
			method: HttpMethod.GET,
			path: `/files/${fileId}/content`,
			responseType: 'arraybuffer',
			timeout: 300000,
		});
		const data = Buffer.from(content);
		const file = await context.files.write({ fileName: metadata.filename, data });
		return {
			file,
			file_id: metadata.id,
			file_name: metadata.filename,
			size_bytes: data.byteLength,
			mimetype: metadata.mimetype ?? null,
		};
	},
});
