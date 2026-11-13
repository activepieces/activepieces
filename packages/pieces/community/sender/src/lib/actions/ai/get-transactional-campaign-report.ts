import { createAction, Property } from '@activepieces/pieces-framework';

import { senderAuth } from '../../auth';
import { senderAiProps } from '../../common/ai-props';
import { senderApi } from '../../common/api';
import { senderGetTransactionalCampaignReportOutputSchema } from '../../output-schemas';

export const senderGetTransactionalCampaignReportAction = createAction({
	auth: senderAuth,
	name: 'sender_get_transactional_campaign_report',
	outputSchema: senderGetTransactionalCampaignReportOutputSchema,
	displayName: 'Get Transactional Campaign Report',
	description: 'Gets sent, open, click and bounce totals for a transactional campaign.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			"Gets a transactional campaign's sent, open, click, bounce, complaint and unsubscribe totals between two dates, broken down by day, week, month or year.",
		idempotent: true,
	},
	props: {
		campaignId: senderAiProps.transactionalCampaignId({ required: true }),
		from: Property.ShortText({
			displayName: 'From Date',
			description: 'Start date, YYYY-MM-DD.',
			required: true,
		}),
		to: Property.ShortText({
			displayName: 'To Date',
			description: 'End date, YYYY-MM-DD.',
			required: true,
		}),
		period: Property.StaticDropdown({
			displayName: 'Period',
			description: 'How to group the totals.',
			required: true,
			options: {
				disabled: false,
				options: [
					{ label: 'Day', value: 'day' },
					{ label: 'Week', value: 'week' },
					{ label: 'Month', value: 'month' },
					{ label: 'Year', value: 'year' },
				],
			},
		}),
	},
	async run(context) {
		return await senderApi.getTransactionalCampaignReport({
			auth: context.auth,
			...context.propsValue,
		});
	},
});
