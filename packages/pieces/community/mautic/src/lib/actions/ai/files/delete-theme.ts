import { createAction } from '@activepieces/pieces-framework';

import { mauticDeleteFileOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticDeleteThemeAction = createAction({
	auth: mauticAuth,
	name: 'mautic_delete_theme',
	outputSchema: mauticDeleteFileOutputSchema,
	displayName: 'Delete Theme',
	description: 'Deletes an installed Mautic theme.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Permanently deletes an installed theme; emails and pages built on it lose their layout. Default themes cannot be deleted.',
		idempotent: false,
	},
	props: {
		theme: mauticAiProps.recordId({
			displayName: 'Theme',
			description: 'Theme folder name, from List Themes.',
		}),
	},
	async run(context) {
		return await mauticApi.deleteTheme({ auth: context.auth, theme: context.propsValue.theme });
	},
});
