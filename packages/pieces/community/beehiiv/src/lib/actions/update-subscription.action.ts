import { MarkdownVariant, Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { customFields, publicationId, subscriptionId } from '../common/props';
import { beehiivAuth } from '../common/auth';
import { beehiivApiCall } from '../common/client';

export const updateSubscriptionAction = createAction({
	auth: beehiivAuth,
	name: 'update_subscription',
	classification: 'WRITE',
	displayName: 'Update Subscription',
	description: 'Update an existing subscription.',
	audience: 'both',
	aiMetadata: { description: 'Updates an existing beehiiv subscription identified by publication ID and subscription ID — change its tier, Stripe customer ID, custom fields, or unsubscribe it from the publication. Use to modify or unsubscribe a known subscriber. Idempotent: repeating with the same fields yields the same end state.', idempotent: true },
	props: {
		publicationId: publicationId,
		subscriptionId: subscriptionId(true),
		changes_info: Property.MarkDown({
			value: 'Empty fields keep their current value. Toggles are always sent.',
			variant: MarkdownVariant.INFO,
		}),
		tier: Property.StaticDropdown({
			displayName: 'Subscription Tier',
			description: 'New tier for this subscriber.',
			required: false,
			width: 'half',
			options: {
				options: [
					{ label: 'Free', value: 'free' },
					{ label: 'Premium', value: 'premium' },
				],
			},
		}),
		stripe_customer_id: Property.ShortText({
			displayName: 'Stripe Customer ID',
			description: 'Links the subscriber to a Stripe customer.',
			placeholder: 'cus_123',
			required: false,
			width: 'half',
		}),
		unsubscribe: Property.Checkbox({
			displayName: 'Unsubscribe',
			description: 'Unsubscribe this person from the publication.',
			required: false,
		}),
		custom_fields: customFields,
	},
	propertyGroups: [
		{
			key: 'subscriber',
			display: 'section',
			label: 'Subscriber',
			icon: 'user',
			props: ['publicationId', 'subscriptionId'],
		},
		{
			key: 'changes',
			display: 'section',
			label: 'Changes',
			icon: 'sliders',
			props: ['changes_info', 'tier', 'stripe_customer_id', 'unsubscribe', 'custom_fields'],
		},
	],
	async run(context) {
		const { publicationId, subscriptionId, tier, stripe_customer_id, unsubscribe } =
			context.propsValue;

		const custom_fields = context.propsValue.custom_fields ?? {};

		const body: Record<string, unknown> = {};

		if (tier) {
			body['tier'] = tier;
		}
		if (stripe_customer_id) {
			body['stripe_customer_id'] = stripe_customer_id;
		}
		if (unsubscribe !== undefined) {
			body['unsubscribe'] = unsubscribe;
		}

		const transformedCustomFields = Object.entries(custom_fields)
			.filter(([_, value]) => {
				if (Array.isArray(value)) {
					return value.length > 0;
				}
				return value !== undefined && value !== null && value !== '';
			})
			.map(([key, value]) => ({
				name: key,
				value: value,
			}));

		if (transformedCustomFields.length > 0) {
			body['custom_fields'] = transformedCustomFields;
		}

		const response = await beehiivApiCall({
			apiKey: context.auth.secret_text,
			method: HttpMethod.PUT,
			resourceUri: `/publications/${publicationId}/subscriptions/${subscriptionId}`,
			body,
		});

		return response;
	},
});
