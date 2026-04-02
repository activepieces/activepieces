import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { typefullyAuth } from '../auth';
import { typefullyApiCall } from '../common/client';
import { socialSetDropdown } from '../common/props';

export const uploadMediaAction = createAction({
	auth: typefullyAuth,
	name: 'typefully_upload_media',
	displayName: 'Upload Media by URL',
	description:
		'Uploads a media file (image, video, GIF, or PDF) from a URL to Typefully. Returns a media ID that can be used when creating drafts.',
	props: {
		social_set_id: socialSetDropdown,
		file_url: Property.ShortText({
			displayName: 'File URL',
			description: 'The URL of the file to upload.',
			required: true,
		}),
	},
	async run(context) {
		const { social_set_id, file_url } = context.propsValue;

		const fileName = extractFileName(file_url);

		const uploadResponse = await typefullyApiCall<{
			media_id: string;
			upload_url: string;
		}>({
			apiKey: context.auth.secret_text,
			method: HttpMethod.POST,
			resourceUri: `/social-sets/${social_set_id}/media`,
			body: { file_name: fileName },
		});

		const contentType = mimeTypeFromFileName(fileName);

		const fileResponse = await httpClient.sendRequest<ArrayBuffer>({
			method: HttpMethod.GET,
			url: file_url,
			headers: {},
			responseType: 'arraybuffer',
		});

		await httpClient.sendRequest({
			method: HttpMethod.PUT,
			url: uploadResponse.upload_url,
			body: fileResponse.body,
			headers: {
				'Content-Type': contentType,
			},
		});

		return {
			media_id: uploadResponse.media_id,
		};
	},
});

function extractFileName(url: string): string {
	try {
		const pathname = new URL(url).pathname;
		const segments = pathname.split('/');
		const lastSegment = segments[segments.length - 1];
		if (lastSegment && /\.(jpg|jpeg|png|webp|gif|mp4|mov|pdf)$/i.test(lastSegment)) {
			return lastSegment;
		}
	} catch {
		// Invalid URL — fall through to default
	}
	return 'upload.bin';
}

function mimeTypeFromFileName(fileName: string): string {
	const ext = fileName.split('.').pop()?.toLowerCase() ?? '';
	const map: Record<string, string> = {
		jpg: 'image/jpeg',
		jpeg: 'image/jpeg',
		png: 'image/png',
		webp: 'image/webp',
		gif: 'image/gif',
		mp4: 'video/mp4',
		mov: 'video/quicktime',
		pdf: 'application/pdf',
	};
	return map[ext] ?? 'application/octet-stream';
}
