import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { emeliaAuth } from '../auth';
import { emeliaClient } from '../common/client';
import { emeliaProps } from '../common/props';

export const getCampaignStatsAction = createAction({
	auth: emeliaAuth,
	name: 'get_campaign_stats',
	classification: 'READ',
	displayName: 'Get Campaign Statistics',
	description: 'Gets the overall statistics of a campaign: contacts reached, opens, clicks, replies, LinkedIn acceptances and more.',
	audience: 'both',
	aiMetadata: {
		description:
			'Get the global statistics of one Emelia multichannel campaign (contacts, sent, opened, clicked, replied, bounced, unsubscribed, LinkedIn visits, invitations, acceptances, with percentages), optionally limited to a date range. Use Get Campaign for status and settings instead. Read-only, safe to retry.',
		idempotent: true,
	},
	props: {
		campaign: emeliaProps.campaignDropdown({ description: 'The campaign to get statistics for.' }),
		from: Property.DateTime({
			displayName: 'From',
			description: 'Only count activity from this date. Leave empty for the whole campaign.',
			required: false,
		}),
		to: Property.DateTime({
			displayName: 'To',
			description: 'Only count activity up to this date. Leave empty for the whole campaign.',
			required: false,
		}),
	},
	async run(context) {
		const { campaign, from, to } = context.propsValue;
		const response = await emeliaClient.request<{ global?: Record<string, unknown> }>({
			apiKey: context.auth.secret_text,
			method: HttpMethod.GET,
			path: '/stats/advanced',
			queryParams: {
				campaignId: campaign,
				...(from ? { start: new Date(from).toISOString() } : {}),
				...(to ? { end: new Date(to).toISOString() } : {}),
			},
		});
		const global = response.global ?? {};
		return {
			campaign_id: campaign,
			...Object.fromEntries(
				Object.entries(global).filter(([, value]) => typeof value === 'number' || typeof value === 'string'),
			),
		};
	},
});
