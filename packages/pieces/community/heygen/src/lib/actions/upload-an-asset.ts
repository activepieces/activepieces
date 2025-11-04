import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { heygenAuth } from '../common/auth';

export const uploadAssetAction = createAction({
	auth: heygenAuth,
	name: 'upload_asset',
	displayName: 'Upload an Asset',
	description:
		'Upload media files (images, videos, or audio) to HeyGen. Supports JPEG, PNG, MP4, WEBM, and MPEG files.',
	props: {
		file: Property.File({
			displayName: 'File',
			description: 'The file to upload (JPEG, PNG, MP4, WEBM, or MPEG).',
			required: true,
		}),
	},
	async run(context) {
		const { file } = context.propsValue;

		const getContentType = (filename: string): string => {
			const extension = filename.toLowerCase().split('.').pop();
			switch (extension) {
				case 'jpg':
				case 'jpeg':
					return 'image/jpeg';
				case 'png':
					return 'image/png';
				case 'mp4':
					return 'video/mp4';
				case 'webm':
					return 'video/webm';
				case 'mpeg':
				case 'mpg':
					return 'audio/mpeg';
				default:
					throw new Error(`Unsupported file type: ${extension}`);
			}
		};

		const contentType = getContentType(file.filename);

		const response = await httpClient.sendRequest({
			method: HttpMethod.POST,
			url: 'https://upload.heygen.com/v1/asset',
			headers: {
				'x-api-key': context.auth as string,
				'Content-Type': contentType,
			},
			body: file.data,
		});

		return response.body;
	},
});
