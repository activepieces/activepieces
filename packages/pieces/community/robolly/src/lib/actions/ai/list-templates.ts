import { createAction } from '@activepieces/pieces-framework';

import { robollyAuth } from '../../auth';
import { robollyApi } from '../../common/api';

export const listTemplatesAction = createAction({
	auth: robollyAuth,
	name: 'robolly_list_templates',
	displayName: 'List Templates',
	description: 'Lists the templates in your Robolly account.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists the templates in the Robolly account with their IDs and names. Use it to find the template ID that Render Template, Render Video, List Template Elements and Update Template need.',
		idempotent: true,
	},
	props: {},
	async run({ auth }) {
		const templates = await robollyApi.listTemplates({ auth });
		return { templates, count: templates.length };
	},
});
