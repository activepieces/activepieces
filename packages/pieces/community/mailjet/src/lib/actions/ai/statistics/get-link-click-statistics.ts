import { createAction, Property } from '@activepieces/pieces-framework';

import { mailjetLinkClickStatisticsOutputSchema } from './output-schemas';
import { mailjetAuth } from '../../../auth';
import { mailjetApi } from '../../../common/api';

export const mailjetGetLinkClickStatisticsAction = createAction({
	auth: mailjetAuth,
	name: 'mailjet_get_link_click_statistics',
	outputSchema: mailjetLinkClickStatisticsOutputSchema,
	displayName: 'Get Link Click Statistics',
	description: 'Gets click counts per link in a campaign.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Gets, for every link in a campaign, its URL, position and unique and total clicks.',
		idempotent: true,
	},
	props: {
		campaignId: Property.Number({
			displayName: 'Campaign ID',
			description: 'Numeric campaign ID, from List Campaigns.',
			required: true,
		}),
	},
	async run(context) {
		const p = context.propsValue;
		return await mailjetApi.get({
			auth: context.auth,
			path: '/v3/REST/statistics/link-click',
			query: { CampaignID: p.campaignId },
		});
	},
});
