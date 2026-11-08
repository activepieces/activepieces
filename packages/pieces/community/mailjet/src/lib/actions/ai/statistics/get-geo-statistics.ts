import { createAction, Property } from '@activepieces/pieces-framework';

import { mailjetGeoStatisticsOutputSchema } from './output-schemas';
import { mailjetAuth } from '../../../auth';
import { mailjetAiProps } from '../../../common/ai-props';
import { mailjetApi } from '../../../common/api';
import { mailjetUtils } from '../../../common/utils';

export const mailjetGetGeoStatisticsAction = createAction({
	auth: mailjetAuth,
	name: 'mailjet_get_geo_statistics',
	outputSchema: mailjetGeoStatisticsOutputSchema,
	displayName: 'Get Geographical Statistics',
	description: 'Gets open and click counts per country.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description: 'Gets open and click counts per country for the account, a campaign or a list.',
		idempotent: true,
	},
	props: {
		campaignId: Property.Number({
			displayName: 'Campaign ID',
			description: 'Only this campaign, from List Campaigns.',
			required: false,
		}),
		contactsListId: Property.Number({
			displayName: 'Contact List ID',
			description: 'Only this contact list, from List Contact Lists.',
			required: false,
		}),
		...mailjetAiProps.paging,
	},
	async run(context) {
		const p = context.propsValue;
		return await mailjetApi.get({
			auth: context.auth,
			path: '/v3/REST/geostatistics',
			query: {
				CampaignID: p.campaignId,
				ContactsList: p.contactsListId,
				...mailjetUtils.pagingQuery(p),
			},
		});
	},
});
