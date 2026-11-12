import { Property, createAction } from '@activepieces/pieces-framework';
import { beehiivAuth } from '../../common/auth';
import { apiKeyOf, beehiivClient, pathFor } from '../../common/client';
import { aiInput, aiProps } from '../../common/ai-props';
import { beehiivOutputSchemas } from '../../common/output-schemas';

export const addSubscriptionTagsAiAction = createAction({
	auth: beehiivAuth,
	name: 'add_subscription_tags',
	classification: 'WRITE',
	displayName: 'Add Tags to Subscription',
	description: 'Adds tags to a subscriber.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Adds one or more tags to a beehiiv subscriber, found by Subscription ID or exact Email (exactly one). Tags that do not exist yet are created (a publication can have at most 100 tags). Tags already on the subscriber are kept, so repeating the call changes nothing.',
		idempotent: true,
	},
	outputSchema: beehiivOutputSchemas.addTags,
	props: {
		publication_id: aiProps.publicationId(),
		subscription_id: aiProps.subscriptionId(),
		email: aiProps.subscriberEmail(),
		tags: Property.Array({ displayName: 'Tags', description: 'Tag names to add.', required: true }),
	},
	async run({ auth, propsValue }) {
		const apiKey = apiKeyOf(auth);
		const publicationId = aiInput.requireText({ value: propsValue.publication_id, label: 'Publication ID' });
		const tags = aiInput.textList({ value: propsValue.tags, label: 'Tags' });
		if (tags === undefined) {
			throw new Error('Tags must contain at least one tag.');
		}
		const subscriptionId = await aiInput.resolveSubscriptionId({ apiKey, publicationId, subscriptionId: propsValue.subscription_id, email: propsValue.email });
		const response = await beehiivClient.request({
			apiKey,
			method: 'POST',
			path: `${pathFor(['publications', publicationId, 'subscriptions', subscriptionId])}/tags`,
			operation: 'add subscription tags',
			body: { tags },
		});
		return { subscription: aiInput.dataOf(response.body), added_tags: tags };
	},
});
