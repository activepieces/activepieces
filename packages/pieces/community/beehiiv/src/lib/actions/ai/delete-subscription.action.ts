import { createAction } from '@activepieces/pieces-framework';
import { beehiivAuth } from '../../common/auth';
import { apiKeyOf, beehiivClient, pathFor } from '../../common/client';
import { aiInput, aiProps } from '../../common/ai-props';
import { beehiivOutputSchemas } from '../../common/output-schemas';

export const deleteSubscriptionAiAction = createAction({
	auth: beehiivAuth,
	name: 'delete_subscription_ai',
	classification: 'DESTRUCTIVE',
	displayName: 'Delete Subscription (AI)',
	description: 'Permanently deletes a subscriber found by subscription ID or email.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Permanently deletes one beehiiv subscriber and their history, found by Subscription ID or exact Email (exactly one). Cannot be undone; to just stop emails use "Unsubscribe Subscriber". Running it again fails with not found.',
		idempotent: false,
	},
	outputSchema: beehiivOutputSchemas.deleteSubscription,
	props: {
		publication_id: aiProps.publicationId(),
		subscription_id: aiProps.subscriptionId(),
		email: aiProps.subscriberEmail(),
	},
	async run({ auth, propsValue }) {
		const apiKey = apiKeyOf(auth);
		const publicationId = aiInput.requireText({ value: propsValue.publication_id, label: 'Publication ID' });
		const subscriptionId = await aiInput.resolveSubscriptionId({
			apiKey,
			publicationId,
			subscriptionId: propsValue.subscription_id,
			email: propsValue.email,
		});
		await beehiivClient.request({
			apiKey,
			method: 'DELETE',
			path: pathFor(['publications', publicationId, 'subscriptions', subscriptionId]),
			operation: 'delete subscription',
		});
		return { deleted: true, subscription_id: subscriptionId };
	},
});
