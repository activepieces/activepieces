import { createAction } from '@activepieces/pieces-framework';

import { mauticGetThemeOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticGetThemeAction = createAction({
	auth: mauticAuth,
	name: 'mautic_get_theme',
	outputSchema: mauticGetThemeOutputSchema,
	displayName: 'Get Theme',
	description: 'Downloads a Mautic theme as a zip file.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Downloads an installed theme as a zip file and returns the file. Theme names come from List Themes.',
		idempotent: true,
	},
	props: {
		theme: mauticAiProps.recordId({
			displayName: 'Theme',
			description: 'Theme folder name, from List Themes.',
		}),
	},
	async run(context) {
		const { theme } = context.propsValue;
		const data = await mauticApi.getTheme({ auth: context.auth, theme });
		return {
			theme,
			file: await context.files.write({ fileName: `${theme}.zip`, data }),
		};
	},
});
