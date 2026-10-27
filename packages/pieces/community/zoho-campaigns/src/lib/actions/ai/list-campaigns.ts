import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoCampaignsAuth } from '../../auth';
import { zohoCampaignsAiProps } from '../../common/ai-props';
import { zohoCampaignsApi } from '../../common/api';
import { zohoCampaignsUtils } from '../../common/utils';
import { zohoCampaignsListCampaignsOutputSchema } from '../../output-schemas';

import type { ZohoCampaignsCampaignStatus } from '../../common/types';

export const listCampaignsAction = createAction({
	auth: zohoCampaignsAuth,
	name: 'zoho_campaigns_list_campaigns',
	outputSchema: zohoCampaignsListCampaignsOutputSchema,
	displayName: 'List Campaigns',
	description: 'Lists campaigns, newest first, optionally filtered by status or name.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists campaigns with their campaign keys, names, statuses and creation times, filtered by status and paged with From Index and Range. Name Contains keeps only campaigns whose name contains the text (case-insensitive) within the returned page. Use it to find the campaign key other actions need.',
		idempotent: true,
	},
	props: {
		status: Property.StaticDropdown<ZohoCampaignsCampaignStatus, false>({
			displayName: 'Status',
			description: 'Only return campaigns in this status. Defaults to all.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'All', value: 'all' },
					{ label: 'Drafts', value: 'drafts' },
					{ label: 'Scheduled', value: 'scheduled' },
					{ label: 'In Progress', value: 'inprogress' },
					{ label: 'Sent', value: 'sent' },
					{ label: 'Stopped', value: 'stopped' },
					{ label: 'Canceled', value: 'canceled' },
					{ label: 'To Be Reviewed', value: 'tobereviewed' },
					{ label: 'Reviewed', value: 'reviewed' },
					{ label: 'Paused', value: 'paused' },
					{ label: 'In Testing', value: 'intesting' },
				],
			},
		}),
		nameContains: Property.ShortText({
			displayName: 'Name Contains',
			description: 'Only keep campaigns whose name contains this text (case-insensitive).',
			required: false,
		}),
		sort: zohoCampaignsAiProps.sort({ required: false }),
		fromIndex: zohoCampaignsAiProps.fromIndex({ required: false }),
		range: zohoCampaignsAiProps.range({ required: false }),
	},
	async run({ auth, propsValue }) {
		const body = zohoCampaignsUtils.assertSuccess({
			body: await zohoCampaignsApi.getRecentCampaigns({
				auth,
				status: propsValue.status,
				sort: propsValue.sort,
				fromindex: propsValue.fromIndex,
				range: propsValue.range,
			}),
		});
		const needle = propsValue.nameContains?.toLowerCase();
		const campaigns = body.recent_campaigns ?? [];
		const matches = needle
			? campaigns.filter((campaign) =>
					(campaign.campaign_name ?? '').toLowerCase().includes(needle),
			  )
			: campaigns;
		return { ...body, recent_campaigns: matches, count: matches.length };
	},
});
