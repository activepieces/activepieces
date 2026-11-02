import { Property, createAction } from '@activepieces/pieces-framework';

import { mauticUploadFileOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticApi } from '../../../common/api';

export const mauticUploadFileAction = createAction({
	auth: mauticAuth,
	name: 'mautic_upload_file',
	outputSchema: mauticUploadFileOutputSchema,
	displayName: 'Upload File',
	description: 'Uploads a file to the Mautic media folders.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Uploads a file to the images or media (asset uploads) folder. Mautic stores it under a new random name and returns that name, plus a public link for images, e.g. for use in email or page HTML. Only extensions allowed in Mautic settings are accepted.',
		idempotent: false,
	},
	props: {
		dir: Property.StaticDropdown({
			displayName: 'Folder',
			required: true,
			options: {
				options: [
					{ label: 'Images', value: 'images' },
					{ label: 'Media', value: 'media' },
				],
			},
		}),
		file: Property.File({ displayName: 'File', required: true }),
		subdir: Property.ShortText({
			displayName: 'Subfolder',
			description: 'Optional subfolder inside the folder, e.g. "banners".',
			required: false,
		}),
	},
	async run(context) {
		return await mauticApi.uploadFile({
			auth: context.auth,
			path: `files/${context.propsValue.dir}/new`,
			file: context.propsValue.file,
			subdir: context.propsValue.subdir,
		});
	},
});
