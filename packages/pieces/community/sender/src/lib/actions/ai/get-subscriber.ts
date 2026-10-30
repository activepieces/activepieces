import { createAction } from '@activepieces/pieces-framework';

import { senderAuth } from '../../auth';
import { senderAiProps } from '../../common/ai-props';
import { senderApi } from '../../common/api';
import { senderGetSubscriberOutputSchema } from '../../output-schemas';

export const senderGetSubscriberAction = createAction({
	auth: senderAuth,
	name: 'sender_get_subscriber',
	outputSchema: senderGetSubscriberOutputSchema,
	displayName: 'Get Subscriber',
	description: 'Gets a subscriber by email, phone or ID.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			"Gets one subscriber's profile (name, phone, statuses, groups and custom field values) by email address, phone number or subscriber ID. Fails with a not-found error when no such subscriber exists.",
		idempotent: true,
	},
	props: {
		subscriberId: senderAiProps.subscriberId({ required: true }),
	},
	async run(context) {
		return await senderApi.getSubscriber({
			auth: context.auth,
			subscriberId: context.propsValue.subscriberId,
		});
	},
});
