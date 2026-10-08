import { createAction } from '@activepieces/pieces-framework';

import { mauticListPagesOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticListPagesAction = createAction({
	auth: mauticAuth,
	name: 'mautic_list_pages',
	outputSchema: mauticListPagesOutputSchema,
	displayName: 'List Landing Pages',
	description: 'Lists Mautic landing pages.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists landing pages with their hit counts. Page with Start and Limit; the response has the total count.',
		idempotent: true,
	},
	props: {
		...mauticAiProps.listOptions,
	},
	async run(context) {
		return await mauticApi.listRecords({
			auth: context.auth,
			resource: 'pages',
			key: 'pages',
			query: context.propsValue,
		});
	},
});
