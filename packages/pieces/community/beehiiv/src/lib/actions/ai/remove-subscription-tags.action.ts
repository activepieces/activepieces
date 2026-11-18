import { Property, createAction } from '@activepieces/pieces-framework';
import { beehiivAuth } from '../../common/auth';
import { apiKeyOf, beehiivClient, pathFor } from '../../common/client';
import { aiInput, aiProps } from '../../common/ai-props';
import { beehiivOutputSchemas } from '../../common/output-schemas';

export const removeSubscriptionTagsAiAction = createAction({
	auth: beehiivAuth,
	name: 'remove_subscription_tags',
	classification: 'WRITE',
	displayName: 'Remove Tags from Subscription',
	description: 'Removes tags from a subscriber.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Removes one or more tags from a beehiiv subscriber, found by Subscription ID or exact Email (exactly one). Tags the subscriber does not have are ignored, so repeating the call changes nothing. The tags themselves stay in the publication.',
		idempotent: true,
	},
	outputSchema: beehiivOutputSchemas.removeTags,
	props: {
		publication_id: aiProps.publicationId(),
		subscription_id: aiProps.subscriptionId(),
		email: aiProps.subscriberEmail(),
		tags: Property.Array({ displayName: 'Tags', description: 'Tag names to remove.', required: true }),
	},
	async run({ auth, propsValue }) {
		const apiKey = apiKeyOf(auth);
		const publicationId = aiInput.requireText({ value: propsValue.publication_id, label: 'Publication ID' });
		const tags = aiInput.textList({ value: propsValue.tags, label: 'Tags' });
		if (tags === undefined) {
			throw new Error('Tags must contain at least one tag.');
		}
		const subscriptionId = await aiInput.resolveSubscriptionId({ apiKey, publicationId, subscriptionId: propsValue.subscription_id, email: propsValue.email });
		await beehiivClient.request({
			apiKey,
			method: 'DELETE',
			path: `${pathFor(['publications', publicationId, 'subscriptions', subscriptionId])}/tags`,
			operation: 'remove subscription tags',
			body: { tags },
		});
		return { subscription_id: subscriptionId, removed_tags: tags };
	},
});
