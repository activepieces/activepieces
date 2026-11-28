import { Property, createAction } from '@activepieces/pieces-framework';
import { beehiivAuth } from '../../common/auth';
import { apiKeyOf, beehiivClient } from '../../common/client';
import { aiInput, aiProps } from '../../common/ai-props';
import { beehiivOutputSchemas } from '../../common/output-schemas';

export const updateSubscriptionAiAction = createAction({
	auth: beehiivAuth,
	name: 'update_subscription_ai',
	classification: 'WRITE',
	displayName: 'Update Subscription (AI)',
	description: 'Updates a subscriber found by subscription ID or email.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Updates one beehiiv subscriber, found by Subscription ID or exact Email (exactly one): change email, tier, premium tiers, Stripe ID, set or clear custom fields, join or leave newsletter lists. Only the fields you give change; everything else is kept. To unsubscribe use "Unsubscribe Subscriber". Repeating the same update gives the same result.',
		idempotent: true,
	},
	outputSchema: beehiivOutputSchemas.writeSubscription,
	props: {
		publication_id: aiProps.publicationId(),
		subscription_id: aiProps.subscriptionId(),
		email: aiProps.subscriberEmail(),
		new_email: Property.ShortText({ displayName: 'New Email', description: 'Change the subscriber email address to this.', required: false }),
		tier: Property.StaticDropdown<string>({
			displayName: 'Tier',
			description: 'Change the tier to free or premium.',
			required: false,
			options: {
				options: [
					{ label: 'Free', value: 'free' },
					{ label: 'Premium', value: 'premium' },
				],
			},
		}),
		premium_tier_ids: Property.Array({ displayName: 'Premium Tier IDs', description: 'Tier IDs from "List Tiers".', required: false }),
		stripe_customer_id: Property.ShortText({ displayName: 'Stripe Customer ID', required: false }),
		custom_fields: Property.Object({
			displayName: 'Custom Fields',
			description: 'Field name to new value, for example {"Company": "Acme"}. Names come from "List Custom Fields".',
			required: false,
		}),
		clear_custom_fields: Property.Array({
			displayName: 'Clear Custom Fields',
			description: 'Names of custom fields whose value should be removed.',
			required: false,
		}),
		newsletter_list_ids: Property.Array({ displayName: 'Add To Newsletter Lists', description: 'Newsletter list IDs to subscribe to (existing lists are kept).', required: false }),
		unsubscribe_newsletter_list_ids: Property.Array({ displayName: 'Remove From Newsletter Lists', description: 'Newsletter list IDs to unsubscribe from.', required: false }),
	},
	async run({ auth, propsValue }) {
		const publicationId = aiInput.requireText({ value: propsValue.publication_id, label: 'Publication ID' });
		const identity = aiInput.subscriberIdentity({ subscriptionId: propsValue.subscription_id, email: propsValue.email });
		const setFields = aiInput.customFieldEntries({ value: propsValue.custom_fields, label: 'Custom Fields' }) ?? [];
		const clearFields = aiInput.textList({ value: propsValue.clear_custom_fields, label: 'Clear Custom Fields' }) ?? [];
		const overlap = clearFields.filter((name) => setFields.some((field) => field.name === name));
		if (overlap.length > 0) {
			throw new Error(`Do not both set and clear the same custom field: ${overlap.join(', ')}.`);
		}
		const newEmail = aiInput.optionalText(propsValue.new_email);
		if (newEmail !== undefined && !newEmail.includes('@')) {
			throw new Error('New Email must be a full email address.');
		}
		const customFields = [...setFields, ...clearFields.map((name) => ({ name, delete: true }))];
		const body = {
			email: newEmail,
			tier: aiInput.oneOf({ value: propsValue.tier, label: 'Tier', allowed: ['free', 'premium'] }),
			premium_tier_ids: aiInput.textList({ value: propsValue.premium_tier_ids, label: 'Premium Tier IDs' }),
			stripe_customer_id: aiInput.optionalText(propsValue.stripe_customer_id),
			custom_fields: customFields.length > 0 ? customFields : undefined,
			newsletter_list_ids: aiInput.textList({ value: propsValue.newsletter_list_ids, label: 'Add To Newsletter Lists' }),
			unsubscribe_newsletter_list_ids: aiInput.textList({ value: propsValue.unsubscribe_newsletter_list_ids, label: 'Remove From Newsletter Lists' }),
		};
		if (Object.values(body).every((value) => value === undefined)) {
			throw new Error('Nothing to update: give at least one field to change.');
		}
		const response = await beehiivClient.request({
			apiKey: apiKeyOf(auth),
			method: 'PUT',
			path: aiInput.subscriptionPath({ publicationId, identity }),
			operation: 'update subscription',
			body,
		});
		return { subscription: aiInput.dataOf(response.body), warnings: aiInput.warningsOf(response.body) };
	},
});
