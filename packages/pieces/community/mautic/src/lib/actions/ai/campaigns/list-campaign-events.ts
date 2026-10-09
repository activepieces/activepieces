import { createAction } from '@activepieces/pieces-framework';

import { mauticListCampaignEventsOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticListCampaignEventsAction = createAction({
	auth: mauticAuth,
	name: 'mautic_list_campaign_events',
	outputSchema: mauticListCampaignEventsOutputSchema,
	displayName: 'List Campaign Events',
	description: 'Lists Mautic campaign events.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists the events (actions, decisions and conditions) across all campaigns, with their campaign. Use Where on "campaign" to narrow to one campaign. Page with Start and Limit; the response has the total count.',
		idempotent: true,
	},
	props: {
		...mauticAiProps.filterOptions,
	},
	async run(context) {
		return await mauticApi.listRecords({
			auth: context.auth,
			resource: 'campaigns/events',
			key: 'events',
			query: context.propsValue,
		});
	},
});
