import { Property, createAction } from '@activepieces/pieces-framework';

import { mauticListFilesOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticApi } from '../../../common/api';

export const mauticListFilesAction = createAction({
	auth: mauticAuth,
	name: 'mautic_list_files',
	outputSchema: mauticListFilesOutputSchema,
	displayName: 'List Files',
	description: 'Lists the files in the Mautic media folders.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists the file names in the images or media (asset uploads) folder, or a subfolder of it.',
		idempotent: true,
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
		subdir: Property.ShortText({
			displayName: 'Subfolder',
			description: 'Optional subfolder inside the folder, e.g. "banners".',
			required: false,
		}),
	},
	async run(context) {
		return await mauticApi.listFiles({
			auth: context.auth,
			dir: context.propsValue.dir,
			subdir: context.propsValue.subdir,
		});
	},
});
