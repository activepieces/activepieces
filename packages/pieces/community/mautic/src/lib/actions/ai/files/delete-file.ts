import { Property, createAction } from '@activepieces/pieces-framework';

import { mauticDeleteFileOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticDeleteFileAction = createAction({
	auth: mauticAuth,
	name: 'mautic_delete_file',
	outputSchema: mauticDeleteFileOutputSchema,
	displayName: 'Delete File',
	description: 'Deletes a file from the Mautic media folders.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Permanently deletes a file from the images or media folder; emails and pages linking to it break. File names come from List Files.',
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
		file: mauticAiProps.recordId({
			displayName: 'File Name',
			description: 'File name with extension, from List Files.',
		}),
		subdir: Property.ShortText({
			displayName: 'Subfolder',
			description: 'Optional subfolder inside the folder, e.g. "banners".',
			required: false,
		}),
	},
	async run(context) {
		return await mauticApi.deleteFile({
			auth: context.auth,
			dir: context.propsValue.dir,
			file: context.propsValue.file,
			subdir: context.propsValue.subdir,
		});
	},
});
