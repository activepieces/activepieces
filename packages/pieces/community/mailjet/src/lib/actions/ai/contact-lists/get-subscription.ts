import { createAction } from '@activepieces/pieces-framework';

import { mailjetSubscriptionOutputSchema } from './output-schemas';
import { mailjetAuth } from '../../../auth';
import { mailjetAiProps } from '../../../common/ai-props';
import { mailjetApi } from '../../../common/api';

export const mailjetGetSubscriptionAction = createAction({
	auth: mailjetAuth,
	name: 'mailjet_get_subscription',
	outputSchema: mailjetSubscriptionOutputSchema,
	displayName: 'Get Subscription',
	description: 'Gets one contact-in-list subscription record.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Gets one subscription record (a contact in a list) by its ID, from List Subscriptions.',
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
			path: `/v3/REST/listrecipient/${encodeURIComponent(p.subscriptionId)}`,
		});
	},
});
