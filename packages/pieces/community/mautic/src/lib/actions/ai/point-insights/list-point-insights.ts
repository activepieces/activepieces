import { createAction } from '@activepieces/pieces-framework';

import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticListPointInsightsAction = createAction({
	auth: mauticAuth,
	name: 'mautic_list_point_insights',
	displayName: 'List Point Insights',
	description: 'Lists Mautic point insights.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists point insights, which compare point group scores and store the result on the contact. Needs Mautic 7. Page with Start and Limit; the response has the total count.',
		idempotent: true,
	},
	props: {
		...mauticAiProps.listOptions,
	},
	async run(context) {
		return await mauticApi.listRecords({
			auth: context.auth,
			resource: 'points/insights',
			key: 'insights',
			query: context.propsValue,
		});
	},
});
