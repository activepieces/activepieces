import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { customFields, publicationId, subscriptionId } from '../common/props';
import { beehiivAuth } from '../common/auth';
import { beehiivApiCall } from '../common/client';

export const updateSubscriptionAction = createAction({
	auth: beehiivAuth,
	name: 'update_subscription',
	displayName: 'Update Subscription',
	description: 'Update an existing subscription.',
	props: {
		publicationId: publicationId,
		subscriptionId: subscriptionId(true),
		tier: Property.StaticDropdown({
			displayName: 'Subscription Tier',
			description: 'Set the tier for this subscription.',
			required: false,
			options: {
				options: [
					{ label: 'Free', value: 'free' },
					{ label: 'Premium', value: 'premium' },
				],
			},
		}),
		stripe_customer_id: Property.ShortText({
			displayName: 'Stripe Customer ID',
			description: 'The Stripe Customer ID of the subscription.',
			required: false,
		}),
		unsubscribe: Property.Checkbox({
			displayName: 'Unsubscribe',
			description: 'Whether to unsubscribe this subscription from the publication.',
			required: false,
		}),
		custom_fields: customFields,
	},
	async run(context) {
		const { publicationId, subscriptionId, tier, stripe_customer_id, unsubscribe } =
			context.propsValue;

		const custom_fields = context.propsValue.custom_fields ?? {};

		const body: Record<string, unknown> = {};

		if (tier !== undefined) {
			body['tier'] = tier;
		}
		if (stripe_customer_id !== undefined) {
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

		console.log(JSON.stringify(body));
		const response = await beehiivApiCall({
			apiKey: context.auth,
			method: HttpMethod.PUT,
			resourceUri: `/publications/${publicationId}/subscriptions/${subscriptionId}`,
			body,
		});

		return response;
	},
});
