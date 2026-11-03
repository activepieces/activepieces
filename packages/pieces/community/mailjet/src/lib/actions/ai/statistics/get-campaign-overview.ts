import { createAction } from '@activepieces/pieces-framework';

import { mailjetCampaignOverviewOutputSchema } from './output-schemas';
import { mailjetAuth } from '../../../auth';
import { mailjetAiProps } from '../../../common/ai-props';
import { mailjetApi } from '../../../common/api';

export const mailjetGetCampaignOverviewAction = createAction({
	auth: mailjetAuth,
	name: 'mailjet_get_campaign_overview',
	outputSchema: mailjetCampaignOverviewOutputSchema,
	displayName: 'Get Campaign Overview',
	description: 'Gets the overview of one campaign.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Gets the overview (subject, status, key counts) of one campaign, draft or A/B test, by the IDType and ID pair from List Campaign Overviews.',
		idempotent: true,
	},
	props: {
		idType: mailjetAiProps.id({
			displayName: 'ID Type',
			description: 'IDType of the overview, from List Campaign Overviews, e.g. "Campaign".',
		}),
		overviewId: mailjetAiProps.id({
			displayName: 'Overview ID',
			description: 'ID of the campaign overview, from List Campaign Overviews.',
		}),
	},
	async run(context) {
		const p = context.propsValue;
		return await mailjetApi.get({
			auth: context.auth,
			path: `/v3/REST/campaignoverview/${encodeURIComponent(p.overviewId)}`,
			query: { IDType: p.idType },
		});
	},
});
