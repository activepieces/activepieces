import { createAction } from '@activepieces/pieces-framework';

import { mauticListStagesOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticListStagesAction = createAction({
	auth: mauticAuth,
	name: 'mautic_list_stages',
	outputSchema: mauticListStagesOutputSchema,
	displayName: 'List Stages',
	description: 'Lists Mautic stages.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists contact lifecycle stages with their weight. Page with Start and Limit; the response has the total count.',
		idempotent: true,
	},
	props: {
		...mauticAiProps.listOptions,
	},
	async run(context) {
		return await mauticApi.listRecords({
			auth: context.auth,
			resource: 'stages',
			key: 'stages',
			query: context.propsValue,
		});
	},
});
