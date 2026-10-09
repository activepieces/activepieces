import { createAction } from '@activepieces/pieces-framework';

import { mailjetSubscriptionStatisticsOutputSchema } from './output-schemas';
import { mailjetAuth } from '../../../auth';
import { mailjetAiProps } from '../../../common/ai-props';
import { mailjetApi } from '../../../common/api';

export const mailjetGetSubscriptionStatisticsAction = createAction({
	auth: mailjetAuth,
	name: 'mailjet_get_subscription_statistics',
	outputSchema: mailjetSubscriptionStatisticsOutputSchema,
	displayName: 'Get Subscription Statistics',
	description: 'Gets engagement counts of one subscription.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Gets the sent, opened, clicked and bounced counts of one subscription, from List Subscriptions.',
		idempotent: true,
	},
	props: {
		subscriptionId: mailjetAiProps.id({
			displayName: 'Subscription ID',
			description: 'Numeric subscription (list recipient) ID, from List Subscriptions.',
		}),
	},
	async run(context) {
		const p = context.propsValue;
		return await mailjetApi.get({
			auth: context.auth,
			path: `/v3/REST/listrecipientstatistics/${encodeURIComponent(p.subscriptionId)}`,
		});
	},
});
