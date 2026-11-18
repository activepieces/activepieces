import { createAction, Property } from '@activepieces/pieces-framework';
import { placidAuth } from '../auth';
import { HttpMethod, httpClient, AuthenticationType } from '@activepieces/pieces-common';
import { PLACID_BASE_URL } from '../common';
import { placidHelpers } from '../common/client';
import { placidSchemas } from '../common/output-schemas';

export const convertFileToUrl = createAction({
	auth: placidAuth,
	name: 'convert_file_to_url',
	classification: 'WRITE',
	displayName: 'Convert File to URL',
	description: 'Convert uploaded file(s) into media URL(s) consumable by Placid templates.',
	audience: 'both',
	aiMetadata: {
		description:
			'Upload a file to Placid temporary media storage and get back a hosted URL (url, also media[0].file_id) that can be passed into a picture layer, e.g. {"photo": {"image": "<url>"}}. Use this before a create action when the image is a file rather than a public URL. Storage is temporary, so render soon after uploading. Not idempotent: each call uploads the file again.',
		idempotent: false,
	},
	outputSchema: placidSchemas.media,
	props: {
		file: Property.File({
			displayName: 'File',
			description: 'The file to convert to a URL.',
			required: true,
		}),
		filename: Property.ShortText({
			displayName: 'Filename',
			description: 'Optional custom filename for the uploaded file.',
			required: false,
		}),
	},
	async run(context) {
		const { file, filename } = context.propsValue;
		const name = filename || file.filename;
		const formData = new FormData();
		const bytes = Buffer.from(file.base64, 'base64');
		formData.append('file', new Blob([bytes], { type: mimeTypeFor({ name, extension: file.extension }) }), name);

		try {
			const response = await httpClient.sendRequest<{ media?: { file_key: string; file_id: string }[] }>({
				method: HttpMethod.POST,
				url: `${PLACID_BASE_URL}/media`,
				body: formData,
				headers: { Accept: 'application/json' },
				authentication: {
					type: AuthenticationType.BEARER_TOKEN,
					token: context.auth.secret_text,
				},
			});
			const media = response.body.media ?? [];
			return { media, url: media[0]?.file_id ?? null };
		} catch (error) {
			throw placidHelpers.toPlacidError({ error, operation: 'file upload', mayHaveApplied: true });
		}
	},
});

const MIME_TYPES: Record<string, string> = {
	png: 'image/png',
	jpg: 'image/jpeg',
	jpeg: 'image/jpeg',
	gif: 'image/gif',
	webp: 'image/webp',
	svg: 'image/svg+xml',
	bmp: 'image/bmp',
	tif: 'image/tiff',
	tiff: 'image/tiff',
	avif: 'image/avif',
	mp4: 'video/mp4',
	mov: 'video/quicktime',
	webm: 'video/webm',
	mp3: 'audio/mpeg',
	wav: 'audio/wav',
	pdf: 'application/pdf',
	ttf: 'font/ttf',
	otf: 'font/otf',
	woff: 'font/woff',
	woff2: 'font/woff2',
};

function mimeTypeFor({ name, extension }: { name: string; extension: string | undefined }): string {
	const ext = (extension || name.split('.').pop() || '').toLowerCase().replace(/^\./, '');
	return MIME_TYPES[ext] ?? 'application/octet-stream';
}
