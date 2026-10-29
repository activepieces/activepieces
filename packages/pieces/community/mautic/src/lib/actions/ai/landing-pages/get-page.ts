import { createAction } from '@activepieces/pieces-framework';

import { mauticGetPageOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticGetPageAction = createAction({
	auth: mauticAuth,
	name: 'mautic_get_page',
	outputSchema: mauticGetPageOutputSchema,
	displayName: 'Get Landing Page',
	description: 'Gets one Mautic landing page by id.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description: 'Gets a single landing page by its numeric id, with its HTML and URL.',
		idempotent: true,
	},
	props: {
		id: mauticAiProps.recordId({
			displayName: 'Landing Page Id',
			description: 'Numeric landing page id, from List Landing Pages or Create Landing Page.',
		}),
	},
	async run(context) {
		return await mauticApi.getRecord({
			auth: context.auth,
			resource: 'pages',
			id: context.propsValue.id,
		});
	},
});
