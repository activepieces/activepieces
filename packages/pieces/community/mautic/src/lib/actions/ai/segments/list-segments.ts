import { createAction } from '@activepieces/pieces-framework';

import { mauticListSegmentsOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticListSegmentsAction = createAction({
	auth: mauticAuth,
	name: 'mautic_list_segments',
	outputSchema: mauticListSegmentsOutputSchema,
	displayName: 'List Segments',
	description: 'Lists Mautic segments.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists segments (contact lists) with their filters. Use Search for free text or Where for exact column conditions. Page with Start and Limit; the response has the total count.',
		idempotent: true,
	},
	props: {
		...mauticAiProps.listOptions,
	},
	async run(context) {
		return await mauticApi.listRecords({
			auth: context.auth,
			resource: 'segments',
			key: 'lists',
			query: context.propsValue,
		});
	},
});
