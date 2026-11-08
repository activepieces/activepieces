import { createAction, Property } from '@activepieces/pieces-framework';

import { mailjetRecipientEspStatisticsOutputSchema } from './output-schemas';
import { mailjetAuth } from '../../../auth';
import { mailjetApi } from '../../../common/api';

export const mailjetGetRecipientEspStatisticsAction = createAction({
	auth: mailjetAuth,
	name: 'mailjet_get_recipient_esp_statistics',
	outputSchema: mailjetRecipientEspStatisticsOutputSchema,
	displayName: 'Get Mailbox Provider Statistics',
	description: 'Gets campaign statistics per mailbox provider.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Gets delivered, opened, clicked and bounced counts of a campaign per recipient mailbox provider (Gmail, Outlook, ...).',
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
			path: '/v3/REST/statistics/recipient-esp',
			query: { CampaignID: p.campaignId },
		});
	},
});
