import { createAction } from '@activepieces/pieces-framework';

import { mauticListTagsOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticListTagsAction = createAction({
	auth: mauticAuth,
	name: 'mautic_list_tags',
	outputSchema: mauticListTagsOutputSchema,
	displayName: 'List Tags',
	description: 'Lists Mautic tags.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description: 'Lists contact tags. Page with Start and Limit; the response has the total count.',
		idempotent: true,
	},
	props: {
		...mauticAiProps.filterOptions,
	},
	async run(context) {
		return await mauticApi.listRecords({
			auth: context.auth,
			resource: 'tags',
			key: 'tags',
			query: context.propsValue,
		});
	},
});
