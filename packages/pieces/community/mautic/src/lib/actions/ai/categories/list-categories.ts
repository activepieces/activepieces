import { createAction } from '@activepieces/pieces-framework';

import { mauticListCategoriesOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticListCategoriesAction = createAction({
	auth: mauticAuth,
	name: 'mautic_list_categories',
	outputSchema: mauticListCategoriesOutputSchema,
	displayName: 'List Categories',
	description: 'Lists Mautic categories.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists categories with the bundle each one applies to. Category ids are used by emails, segments, campaigns, assets and more. Page with Start and Limit; the response has the total count.',
		idempotent: true,
	},
	props: {
		...mauticAiProps.listOptions,
	},
	async run(context) {
		return await mauticApi.listRecords({
			auth: context.auth,
			resource: 'categories',
			key: 'categories',
			query: context.propsValue,
		});
	},
});
