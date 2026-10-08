import { createAction } from '@activepieces/pieces-framework';

import { mauticDeletePageOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticDeletePageAction = createAction({
	auth: mauticAuth,
	name: 'mautic_delete_page',
	outputSchema: mauticDeletePageOutputSchema,
	displayName: 'Delete Landing Page',
	description: 'Permanently deletes a Mautic landing page.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description: 'Permanently deletes a landing page and its hit stats. Cannot be undone.',
		idempotent: false,
	},
	props: {
		id: mauticAiProps.recordId({
			displayName: 'Landing Page Id',
			description: 'Numeric landing page id, from List Landing Pages or Create Landing Page.',
		}),
	},
	async run(context) {
		return await mauticApi.deleteRecord({
			auth: context.auth,
			resource: 'pages',
			id: context.propsValue.id,
		});
	},
});
