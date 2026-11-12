import { Property, createAction } from '@activepieces/pieces-framework';

import { mauticDeleteFileOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticApi } from '../../../common/api';

export const mauticUploadThemeAction = createAction({
	auth: mauticAuth,
	name: 'mautic_upload_theme',
	outputSchema: mauticDeleteFileOutputSchema,
	displayName: 'Upload Theme',
	description: 'Installs a Mautic theme from a zip file.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Installs a theme from a zip file with the theme folder inside; an existing theme with the same name is replaced.',
		idempotent: false,
	},
	props: {
		file: Property.File({ displayName: 'Theme Zip', required: true }),
	},
	async run(context) {
		return await mauticApi.uploadFile({
			auth: context.auth,
			path: 'themes/new',
			file: context.propsValue.file,
		});
	},
});
