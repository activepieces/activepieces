import { createAction, Property } from '@activepieces/pieces-framework';

import { emailOctopusAuth } from '../../auth';
import { emailOctopusAiProps } from '../../common/ai-props';
import { emailOctopusApi } from '../../common/api';
import { campaignContactReportOutputSchema } from '../../output-schemas';

export const getCampaignContactReportAction = createAction({
	auth: emailOctopusAuth,
	name: 'emailoctopus_get_campaign_contact_report',
	outputSchema: campaignContactReportOutputSchema,
	displayName: 'Get Campaign Contact Report',
	description: 'Lists the contacts who opened, clicked, bounced, … for a campaign.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists the contacts of a sent EmailOctopus campaign that match one engagement status (sent, opened, clicked, bounced, complained, unsubscribed, not-opened, not-clicked), one page at a time. Returns `paging.next.starting_after` for the next page with the same status.',
		idempotent: true,
	},
	props: {
		campaignId: emailOctopusAiProps.campaignId({ required: true }),
		status: Property.StaticDropdown({
			displayName: 'Status',
			description: 'Which contacts to list.',
			required: true,
			options: {
				disabled: false,
				options: [
					{ label: 'Sent', value: 'sent' },
					{ label: 'Opened', value: 'opened' },
					{ label: 'Clicked', value: 'clicked' },
					{ label: 'Bounced', value: 'bounced' },
					{ label: 'Complained', value: 'complained' },
					{ label: 'Unsubscribed', value: 'unsubscribed' },
					{ label: 'Not opened', value: 'not-opened' },
					{ label: 'Not clicked', value: 'not-clicked' },
				],
			},
		}),
		limit: emailOctopusAiProps.limit({ required: false }),
		startingAfter: emailOctopusAiProps.startingAfter({ required: false }),
	},
	async run(context) {
		const { campaignId, status, limit, startingAfter } = context.propsValue;
		return await emailOctopusApi.getCampaignContactReport({
			auth: context.auth,
			campaignId,
			status,
			limit: limit ?? undefined,
			startingAfter: startingAfter ?? undefined,
		});
	},
});
