import { createAction } from '@activepieces/pieces-framework';
import { AuthenticationType, httpClient, HttpMethod } from '@activepieces/pieces-common';
import { whatsappAuth } from '../auth';
import { whatsappProps } from '../common/props';
import { whatsappClient } from '../common/client';
import { MediaInfo } from './get-media-url';
import { downloadMediaOutputSchema } from '../output-schemas';

export const downloadMedia = createAction({
	auth: whatsappAuth,
	name: 'download_media',
	outputSchema: downloadMediaOutputSchema,
	classification: 'READ',
	displayName: 'Download Media',
	description: 'Downloads a received media file so later steps can use it.',
	audience: 'both',
	aiMetadata: {
		description:
			'Downloads the file behind a WhatsApp media ID, typically one received on the New Incoming Message trigger, and returns it as a file plus its MIME type and size. Use this instead of Get Media URL when you need the content rather than a short-lived link. Idempotent — a pure read.',
		idempotent: true,
	},
	props: {
		media_id: whatsappProps.mediaId,
	},
	async run(context) {
		const accessToken = context.auth.props.access_token;
		const info = await whatsappClient.request<MediaInfo>({
			accessToken,
			method: HttpMethod.GET,
			path: `/${context.propsValue.media_id}`,
		});
		const download = await httpClient.sendRequest({
			method: HttpMethod.GET,
			url: info.url,
			authentication: {
				type: AuthenticationType.BEARER_TOKEN,
				token: accessToken,
			},
			responseType: 'stream',
		});
		const extension = mimeExtension(info.mime_type);
		const fileName = `${info.id}${extension ? `.${extension}` : ''}`;
		const file = await context.files.write({ fileName, data: download.body });
		return {
			file,
			id: info.id,
			mime_type: info.mime_type,
			sha256: info.sha256,
			file_size: info.file_size,
		};
	},
});

function mimeExtension(mimeType: string): string | undefined {
	const subtype = mimeType.split('/')[1];
	return MIME_EXTENSIONS[mimeType] ?? subtype;
}

const MIME_EXTENSIONS: Record<string, string> = {
	'image/jpeg': 'jpg',
	'audio/mpeg': 'mp3',
	'audio/mp4': 'm4a',
	'audio/ogg': 'ogg',
	'video/3gpp': '3gp',
	'text/plain': 'txt',
	'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
	'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
	'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
	'application/msword': 'doc',
	'application/vnd.ms-excel': 'xls',
	'application/vnd.ms-powerpoint': 'ppt',
};
