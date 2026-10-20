import { createAction, Property } from '@activepieces/pieces-framework';

import { mailjetUserAgentStatisticsOutputSchema } from './output-schemas';
import { mailjetAuth } from '../../../auth';
import { mailjetAiProps } from '../../../common/ai-props';
import { mailjetApi } from '../../../common/api';
import { mailjetUtils } from '../../../common/utils';

export const mailjetGetUserAgentStatisticsAction = createAction({
	auth: mailjetAuth,
	name: 'mailjet_get_user_agent_statistics',
	outputSchema: mailjetUserAgentStatisticsOutputSchema,
	displayName: 'Get User Agent Statistics',
	description: 'Gets open or click counts per email client and platform.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Gets open or click counts per user agent (email client, browser, platform) for the account, a campaign or a list.',
		idempotent: true,
	},
	props: {
		event: Property.StaticDropdown({
			displayName: 'Event',
			description: 'Count opens or clicks.',
			required: false,
			options: {
				options: [
					{ label: 'open', value: 'open' },
					{ label: 'click', value: 'click' },
				],
			},
		}),
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
			path: '/v3/REST/useragentstatistics',
			query: {
				Event: p.event,
				CampaignID: p.campaignId,
				ContactsList: p.contactsListId,
				...mailjetUtils.pagingQuery(p),
			},
		});
	},
});
