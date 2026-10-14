import { createAction, Property } from '@activepieces/pieces-framework';

import { mailjetImageOutputSchema } from './output-schemas';
import { mailjetAuth } from '../../../auth';
import { mailjetApi } from '../../../common/api';

export const mailjetUploadImageAction = createAction({
	auth: mailjetAuth,
	name: 'mailjet_upload_image',
	outputSchema: mailjetImageOutputSchema,
	displayName: 'Upload Image',
	description: 'Uploads an image to the image gallery.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Uploads a JPEG, PNG, GIF, SVG or WebP image (max 2 MB) to the gallery and returns its ID and URL for use in templates.',
		idempotent: false,
	},
	props: {
		file: Property.File({
			displayName: 'File',
			description: 'Image file, max 2 MB.',
			required: true,
		}),
		name: Property.ShortText({ displayName: 'Name', description: 'Image name.', required: true }),
		status: Property.StaticDropdown({
			displayName: 'Status',
			description: 'open allows edits (default), locked prevents them.',
			required: false,
			options: {
				options: [
					{ label: 'open', value: 'open' },
					{ label: 'locked', value: 'locked' },
				],
			},
		}),
		labelIds: Property.Array({
			displayName: 'Label IDs',
			description: 'Numeric label IDs, from List Labels.',
			required: false,
		}),
	},
	async run(context) {
		const p = context.propsValue;
		return await mailjetApi.uploadImage({
			auth: context.auth,
			file: p.file,
			metadata: { Name: p.name, Status: p.status ?? 'open', LabelIDs: p.labelIds },
		});
	},
});
