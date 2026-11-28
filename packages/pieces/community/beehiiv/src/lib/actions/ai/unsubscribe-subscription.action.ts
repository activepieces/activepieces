import { createAction } from '@activepieces/pieces-framework';
import { beehiivAuth } from '../../common/auth';
import { apiKeyOf, beehiivClient } from '../../common/client';
import { aiInput, aiProps } from '../../common/ai-props';
import { beehiivOutputSchemas } from '../../common/output-schemas';

export const unsubscribeSubscriptionAiAction = createAction({
	auth: beehiivAuth,
	name: 'unsubscribe_subscription',
	classification: 'DESTRUCTIVE',
	displayName: 'Unsubscribe Subscriber',
	description: 'Unsubscribes a subscriber from the publication.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Unsubscribes one beehiiv subscriber, found by Subscription ID or exact Email (exactly one); status becomes inactive and they stop receiving emails, but the record and history are kept. Use "Delete Subscription (AI)" only to erase the record. Running it again on an unsubscribed subscriber changes nothing.',
		idempotent: true,
	},
	outputSchema: beehiivOutputSchemas.unsubscribe,
	props: {
		publication_id: aiProps.publicationId(),
		subscription_id: aiProps.subscriptionId(),
		email: aiProps.subscriberEmail(),
	},
	async run({ auth, propsValue }) {
		const publicationId = aiInput.requireText({ value: propsValue.publication_id, label: 'Publication ID' });
		const identity = aiInput.subscriberIdentity({ subscriptionId: propsValue.subscription_id, email: propsValue.email });
		const response = await beehiivClient.request({
			apiKey: apiKeyOf(auth),
			method: 'PUT',
			path: aiInput.subscriptionPath({ publicationId, identity }),
			operation: 'unsubscribe subscription',
			body: { unsubscribe: true },
		});
		return { subscription: aiInput.dataOf(response.body) };
	},
});
