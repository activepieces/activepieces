import { Property, createAction } from '@activepieces/pieces-framework';
import { beehiivAuth } from '../../common/auth';
import { apiKeyOf, beehiivClient } from '../../common/client';
import { SUBSCRIPTION_EXPAND_VALUES, aiInput, aiProps } from '../../common/ai-props';
import { beehiivOutputSchemas } from '../../common/output-schemas';

export const getSubscriptionAiAction = createAction({
	auth: beehiivAuth,
	name: 'get_subscription',
	classification: 'READ',
	displayName: 'Get Subscription',
	description: 'Gets one subscriber by subscription ID or email.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Gets one beehiiv subscriber by Subscription ID or exact Email (give exactly one), optionally with custom fields, tags, stats and newsletter lists. Fails with not found when no subscriber matches. Use it to check whether someone is subscribed. Read-only.',
		idempotent: true,
	},
	outputSchema: beehiivOutputSchemas.getSubscription,
	props: {
		publication_id: aiProps.publicationId(),
		subscription_id: aiProps.subscriptionId(),
		email: aiProps.subscriberEmail(),
		include: Property.StaticMultiSelectDropdown<string>({
			displayName: 'Include',
			description: 'Extra data to add. Defaults to custom_fields and tags.',
			required: false,
			options: {
				options: SUBSCRIPTION_EXPAND_VALUES.map((value) => ({ label: value, value })),
			},
		}),
	},
	async run({ auth, propsValue }) {
		const publicationId = aiInput.requireText({ value: propsValue.publication_id, label: 'Publication ID' });
		const identity = aiInput.subscriberIdentity({ subscriptionId: propsValue.subscription_id, email: propsValue.email });
		const response = await beehiivClient.request({
			apiKey: apiKeyOf(auth),
			method: 'GET',
			path: aiInput.subscriptionPath({ publicationId, identity }),
			operation: 'get subscription',
			query: { 'expand[]': aiInput.textList({ value: propsValue.include, label: 'Include' }) ?? ['custom_fields', 'tags'] },
		});
		return aiInput.dataOf(response.body);
	},
});
