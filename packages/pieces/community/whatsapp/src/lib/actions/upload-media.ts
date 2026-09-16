import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { whatsappAuth } from '../auth';
import { commonProps } from '../common/utils';
import { whatsappClient } from '../common/client';
import { uploadMediaOutputSchema } from '../output-schemas';

export const uploadMedia = createAction({
	auth: whatsappAuth,
	name: 'upload_media',
	outputSchema: uploadMediaOutputSchema,
	classification: 'WRITE',
	displayName: 'Upload Media',
	description: 'Uploads a file to WhatsApp and returns a media ID you can send.',
	audience: 'both',
	aiMetadata: {
		description:
			'Uploads a file from a previous step to WhatsApp and returns a media ID that stays valid for 30 days. Use this before Send Media when the file is not reachable at a public URL. Images max 5 MB, audio and video max 16 MB, documents max 100 MB. Not idempotent — each call stores a new copy and returns a new ID.',
		idempotent: false,
	},
	props: {
		phone_number_id: commonProps.phone_number_id,
		file: Property.File({
			displayName: 'File',
			description: 'The file to upload, from a previous step or a URL.',
			required: true,
		}),
		mime_type: Property.StaticDropdown({
			displayName: 'File Type',
			description: 'Must match the actual file contents; WhatsApp rejects mismatches.',
			required: true,
			options: {
				options: [
					{ label: 'JPEG image', value: 'image/jpeg' },
					{ label: 'PNG image', value: 'image/png' },
					{ label: 'WebP sticker', value: 'image/webp' },
					{ label: 'MP4 video', value: 'video/mp4' },
					{ label: '3GPP video', value: 'video/3gpp' },
					{ label: 'AAC audio', value: 'audio/aac' },
					{ label: 'AMR audio', value: 'audio/amr' },
					{ label: 'MP3 audio', value: 'audio/mpeg' },
					{ label: 'MP4 audio', value: 'audio/mp4' },
					{ label: 'OGG audio', value: 'audio/ogg' },
					{ label: 'PDF document', value: 'application/pdf' },
					{ label: 'Plain text', value: 'text/plain' },
					{ label: 'Word document', value: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
					{ label: 'Excel spreadsheet', value: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
					{ label: 'PowerPoint presentation', value: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' },
				],
			},
		}),
	},
	async run(context) {
		const { phone_number_id, file, mime_type } = context.propsValue;
		const formData = new FormData();
		formData.append('messaging_product', 'whatsapp');
		formData.append('type', mime_type);
		formData.append('file', new Blob([file.data], { type: mime_type }), file.filename);
		return whatsappClient.request<{ id: string }>({
			accessToken: context.auth.props.access_token,
			method: HttpMethod.POST,
			path: `/${phone_number_id}/media`,
			body: formData,
		});
	},
});
