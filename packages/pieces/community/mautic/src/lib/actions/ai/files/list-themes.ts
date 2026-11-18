import { createAction } from '@activepieces/pieces-framework';

import { mauticListThemesOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticApi } from '../../../common/api';

export const mauticListThemesAction = createAction({
	auth: mauticAuth,
	name: 'mautic_list_themes',
	outputSchema: mauticListThemesOutputSchema,
	displayName: 'List Themes',
	description: 'Lists the installed Mautic themes.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists the installed themes for emails, landing pages and forms, keyed by theme folder name.',
		idempotent: true,
	},
	props: {},
	async run(context) {
		return await mauticApi.listThemes({ auth: context.auth });
	},
});
