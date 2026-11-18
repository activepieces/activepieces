import { createAction } from '@activepieces/pieces-framework';
import { beehiivAuth } from '../common/auth';
import { publicationId, subscriptionId } from '../common/props';
import { apiKeyOf, beehiivClient, pathFor } from '../common/client';
import { aiInput } from '../common/ai-props';
import { beehiivOutputSchemas } from '../common/output-schemas';

export const deleteSubscriptionAction = createAction({
	auth: beehiivAuth,
	name: 'delete_subscription',
	classification: 'DESTRUCTIVE',
	displayName: 'Delete Subscription',
	description: 'Permanently deletes a subscription from a Beehiiv publication.',
	audience: 'human',
	aiMetadata: {
		description:
			'Permanently deletes a subscription from a beehiiv publication by publication and subscription ID. This is not an unsubscribe: the record is removed. Running it again fails with not found.',
		idempotent: false,
	},
	outputSchema: beehiivOutputSchemas.humanDeleteSubscription,
	props: {
		publicationId: publicationId,
		subscriptionId: subscriptionId(true),
	},
	async run(context) {
		const { publicationId, subscriptionId } = context.propsValue;

		await beehiivClient.request({
			apiKey: apiKeyOf(context.auth),
			method: 'DELETE',
			path: pathFor(['publications', publicationId, 'subscriptions', aiInput.requireText({ value: subscriptionId, label: 'Subscription ID' })]),
			operation: 'delete subscription',
		});

		return { deleted: true, subscription_id: subscriptionId };
	},
});
